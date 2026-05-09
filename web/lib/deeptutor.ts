import "server-only";

import { randomUUID } from "node:crypto";
import {
  buildExerciseData,
  type GuideKnowledgePoint,
  type LessonQuestionDraft,
  type LessonScriptDraft,
  type LessonScriptStepDraft,
} from "@/lib/course-data";
import { buildArtifactPromptDirective, getCourseArtifactOption, type CourseArtifactKind } from "@/lib/course-artifacts";
import { getDeepTutorAuthHeaders, getDeepTutorUrl } from "@/lib/deeptutor-config";
import { shouldUseLocalDeepTutorFallback } from "@/lib/deeptutor-fallback";

export interface IngestDocumentResult {
  id: string;
  knowledgeBaseName: string;
  taskId: string | null;
  backendMode: "live" | "stub";
  note: string;
}

export interface GenerateCourseParams {
  title: string;
  subject: string;
  difficulty: string;
  prompt: string;
  artifactKind?: CourseArtifactKind;
  sourceMode: "topic" | "upload";
  knowledgeBaseName?: string | null;
}

export interface GenerateCourseResult {
  sessionId: string;
  knowledgePoints: GuideKnowledgePoint[];
  progress: number;
  currentLessonIndex: number;
  backendMode: "live" | "stub";
  raw: Record<string, unknown>;
}

export interface AskQuestionContext {
  sessionId?: string;
  knowledgeIndex?: number | null;
}

export interface GenerateExerciseContext {
  courseId: string;
  lessonTitle: string;
  courseTitle: string;
  lessonSummary?: string;
  sessionId?: string;
  knowledgeIndex?: number | null;
  knowledgeBaseName?: string | null;
  recentPerformance?: string[];
}

interface SseEnvelope {
  event: string;
  data: Record<string, unknown>;
}

interface KnowledgeBaseProgressResponse {
  stage?: string;
  status?: string;
  message?: string;
  error?: string;
  task_id?: string;
}

export class DeepTutorClientError extends Error {
  status: number | null;
  details: unknown;

  constructor(message: string, status?: number | null, details?: unknown) {
    super(message);
    this.name = "DeepTutorClientError";
    this.status = status ?? null;
    this.details = details;
  }
}

function getDeepTutorHeaders(contentType?: string) {
  return {
    ...(contentType ? { "Content-Type": contentType } : {}),
    ...getDeepTutorAuthHeaders(),
  };
}

function isStubMode() {
  return !getDeepTutorUrl();
}

function logStubResponse(operation: string, detail: Record<string, unknown> = {}) {
  console.warn("[DeepTutor][stub]", {
    stub: true,
    operation,
    ...detail,
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function buildKnowledgeBaseName(fileName: string, userId: string) {
  const stem = fileName.replace(/\.[^.]+$/, "");
  return `${slugify(userId)}-${slugify(stem) || "kb"}-${Date.now().toString(36)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isKnowledgeBaseReady(progress: KnowledgeBaseProgressResponse) {
  const stage = typeof progress.stage === "string" ? progress.stage : null;
  const status = typeof progress.status === "string" ? progress.status : null;
  return stage === "completed" || status === "ready";
}

async function waitForKnowledgeBaseReady(
  knowledgeBaseName: string,
  options: { timeoutMs?: number; pollIntervalMs?: number } = {},
) {
  const timeoutMs = options.timeoutMs ?? 120_000;
  const pollIntervalMs = options.pollIntervalMs ?? 2_000;
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = null;
  let lastProgress: KnowledgeBaseProgressResponse | null = null;

  while (Date.now() < deadline) {
    let progress: KnowledgeBaseProgressResponse | null = null;

    try {
      progress = await fetchJson<KnowledgeBaseProgressResponse>(
        `/api/v1/knowledge/${encodeURIComponent(knowledgeBaseName)}/progress`,
        { method: "GET" },
      );
    } catch (error) {
      if (shouldUseLocalDeepTutorFallback(error)) {
        throw error;
      }

      lastError = error;
      await sleep(pollIntervalMs);
      continue;
    }

    lastProgress = progress;

    if (isKnowledgeBaseReady(progress)) {
      return;
    }

    if (progress.stage === "error" || progress.status === "error") {
      throw new DeepTutorClientError(
        `Knowledge base "${knowledgeBaseName}" reported an error while initializing.`,
        null,
        progress,
      );
    }

    await sleep(pollIntervalMs);
  }

  throw new DeepTutorClientError(
    `Timed out waiting for knowledge base "${knowledgeBaseName}" to become ready.`,
    null,
    lastError ?? lastProgress,
  );
}

async function fetchJson<T>(
  path: string,
  init: RequestInit = {},
  options: { allowStub?: boolean } = {},
): Promise<T> {
  if (isStubMode()) {
    if (options.allowStub) {
      throw new DeepTutorClientError("DeepTutor URL is not configured", null, { stub: true });
    }
    throw new DeepTutorClientError("DeepTutor URL is not configured");
  }

  const response = await fetch(`${getDeepTutorUrl()}${path}`, {
    ...init,
    headers: {
      ...getDeepTutorHeaders(
        init.body instanceof FormData ? undefined : "application/json",
      ),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new DeepTutorClientError(
      detail?.detail || `DeepTutor request failed with ${response.status}`,
      response.status,
      detail,
    );
  }

  return (await response.json()) as T;
}

async function fetchSse(path: string, body: Record<string, unknown>) {
  if (isStubMode()) {
    throw new DeepTutorClientError("DeepTutor URL is not configured", null, { stub: true });
  }

  const response = await fetch(`${getDeepTutorUrl()}${path}`, {
    method: "POST",
    headers: getDeepTutorHeaders("application/json"),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new DeepTutorClientError(
      detail?.detail || `DeepTutor request failed with ${response.status}`,
      response.status,
      detail,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new DeepTutorClientError("DeepTutor stream did not return a body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  const events: SseEnvelope[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const eventMatch = chunk.match(/^event:\s*(.+)$/m);
      const dataMatch = chunk.match(/^data:\s*(.+)$/m);
      if (!eventMatch || !dataMatch) continue;

      try {
        events.push({
          event: eventMatch[1].trim(),
          data: JSON.parse(dataMatch[1]) as Record<string, unknown>,
        });
      } catch {
        continue;
      }
    }
  }

  return events;
}

function buildStubKnowledgePoints(title: string, artifactKind?: CourseArtifactKind): GuideKnowledgePoint[] {
  const option = getCourseArtifactOption(artifactKind);
  const previewItems =
    option.kind === "slides"
      ? [
          "Opening claim and stakes",
          "Historical context",
          "Key turning point",
          "Evidence to examine",
          "Visual timeline",
          "Cause and effect",
          "Common misconception",
          "Discussion checkpoint",
          "Closing synthesis",
        ]
      : option.previewItems;

  return previewItems.map((item, index) => ({
    knowledge_title: item.replace(/^L\d+\s*[-·]\s*/i, "") || `${title}: part ${index + 1}`,
    knowledge_summary:
      option.kind === "slides"
        ? `A presentation-ready section for ${title} with a topic-specific headline, concrete evidence, a visual brief, and presenter notes that explain the idea in enough detail to teach from.`
        : option.kind === "study-guide"
          ? `Review section for ${title}, focused on what to remember and how to check yourself.`
          : option.kind === "quiz-set"
            ? `Practice prompt area for ${title}, with rationale and remediation focus.`
            : option.kind === "cheat-sheet"
              ? `Reference block for ${title}, with compact facts, fast examples, and common traps.`
            : option.kind === "lesson-plan"
              ? `Teachable segment for ${title}, including activity flow and a quick check.`
              : "Establish the vocabulary, intuition, and next action for this part of the course.",
  }));
}

function buildStubCourseResult(params: GenerateCourseParams): GenerateCourseResult {
  const sessionId = `stub-session-${randomUUID()}`;
  const knowledgePoints = buildStubKnowledgePoints(params.title, params.artifactKind);

  return {
    sessionId,
    knowledgePoints,
    progress: 0,
    currentLessonIndex: 0,
    backendMode: "stub",
    raw: {
      success: true,
      session_id: sessionId,
      knowledge_points: knowledgePoints,
    },
  };
}

function buildStubIngestResult(fileName: string, userId: string, note: string): IngestDocumentResult {
  return {
    id: `stub-source-${randomUUID()}`,
    knowledgeBaseName: buildKnowledgeBaseName(fileName, userId),
    taskId: null,
    backendMode: "stub",
    note,
  };
}

function buildStubExercise(lessonId: string, context: GenerateExerciseContext) {
  return buildExerciseData({
    courseId: context.courseId,
    lessonId,
    lessonTitle: context.lessonTitle,
    courseTitle: context.courseTitle,
    lessonSummary: context.lessonSummary,
    question: `Which statement best captures the core idea behind ${context.lessonTitle}?`,
    options: {
      A: "It is only a memorization trick with no reusable structure.",
      B: "It is the most concrete example of the concept in action.",
      C: "It shows how the concept behaves, why it matters, and where it breaks.",
      D: "It replaces the rest of the course and makes later lessons unnecessary.",
    },
    correctAnswer: "C",
    explanation:
      "The strongest answer is the one that connects mechanism, purpose, and boundary conditions, not just a slogan.",
    backendMode: "stub",
  });
}

export async function ingestDocument(
  file: File,
  userId: string,
): Promise<IngestDocumentResult> {
  if (isStubMode()) {
    logStubResponse("ingestDocument", {
      fileName: file.name,
      userId,
    });

    return buildStubIngestResult(
      file.name,
      userId,
      "Stubbed because DEEPTUTOR_URL is not configured.",
    );
  }

  const knowledgeBaseName = buildKnowledgeBaseName(file.name, userId);
  const formData = new FormData();
  formData.set("name", knowledgeBaseName);
  formData.append("files", file);

  let data: {
    task_id?: string;
    message?: string;
  };

  try {
    data = await fetchJson<{
      task_id?: string;
      message?: string;
    }>("/api/v1/knowledge/create", {
      method: "POST",
      body: formData,
      headers: getDeepTutorHeaders(),
    });
  } catch (error) {
    if (shouldUseLocalDeepTutorFallback(error)) {
      logStubResponse("ingestDocument.fallback", {
        fileName: file.name,
        userId,
        reason: errorMessage(error),
      });

      return buildStubIngestResult(
        file.name,
        userId,
        "Stubbed because the configured DeepTutor backend is unreachable in local development.",
      );
    }

    throw error;
  }

  return {
    id: knowledgeBaseName,
    knowledgeBaseName,
    taskId: data.task_id ?? null,
    backendMode: "live",
    note: data.message ?? "Knowledge base creation started.",
  };
}

function buildGuidePrompt(params: GenerateCourseParams) {
  const lines = [
    `Course title: ${params.title}`,
    `Subject: ${params.subject}`,
    `Difficulty: ${params.difficulty}`,
    buildArtifactPromptDirective(params.artifactKind),
  ];

  const cleanedPrompt = params.prompt.trim();
  if (cleanedPrompt) {
    lines.push(`Learning goal: ${cleanedPrompt}`);
  }

  if (params.sourceMode === "upload") {
    lines.push("Use the attached knowledge base as the primary source of truth for the course plan.");
  }

  return lines.join("\n");
}

export async function generateCourse(
  sourceIds: string[],
  params: GenerateCourseParams,
): Promise<GenerateCourseResult> {
  if (isStubMode()) {
    logStubResponse("generateCourse", {
      title: params.title,
      sourceMode: params.sourceMode,
    });

    return buildStubCourseResult(params);
  }

  try {
    const knowledgeBaseName =
      params.sourceMode === "upload"
        ? params.knowledgeBaseName ?? sourceIds[0] ?? null
        : null;

    if (params.sourceMode === "upload" && knowledgeBaseName) {
      await waitForKnowledgeBaseReady(knowledgeBaseName);
    }

    const created = await fetchJson<{
      success?: boolean;
      session_id?: string;
      knowledge_points?: GuideKnowledgePoint[];
      total_points?: number;
      message?: string;
    }>("/api/v1/guide/create_session", {
      method: "POST",
      body: JSON.stringify({
        user_input: buildGuidePrompt(params),
        ...(knowledgeBaseName ? { kb_name: knowledgeBaseName } : {}),
      }),
    });

    if (!created.session_id || !Array.isArray(created.knowledge_points)) {
      throw new DeepTutorClientError(
        "DeepTutor did not return a guided learning session for course generation.",
        null,
        created,
      );
    }

    let currentLessonIndex = 0;
    let progress = 0;

    try {
      const started = await fetchJson<{
        current_index?: number;
        progress?: number;
      }>("/api/v1/guide/start", {
        method: "POST",
        body: JSON.stringify({ session_id: created.session_id }),
      });

      currentLessonIndex =
        typeof started.current_index === "number" ? started.current_index : 0;
      progress = typeof started.progress === "number" ? started.progress : 0;
    } catch {
      currentLessonIndex = 0;
      progress = 0;
    }

    return {
      sessionId: created.session_id,
      knowledgePoints: created.knowledge_points,
      progress,
      currentLessonIndex,
      backendMode: "live",
      raw: created as Record<string, unknown>,
    };
  } catch (error) {
    if (shouldUseLocalDeepTutorFallback(error)) {
      logStubResponse("generateCourse.fallback", {
        title: params.title,
        sourceMode: params.sourceMode,
        reason: errorMessage(error),
      });

      return buildStubCourseResult(params);
    }

    throw error;
  }
}

export async function askQuestion(
  courseId: string,
  question: string,
  context: AskQuestionContext = {},
) {
  if (isStubMode()) {
    logStubResponse("askQuestion", {
      courseId,
      questionLength: question.length,
      sessionId: context.sessionId ?? null,
    });

    return {
      answer:
        "Stub mode is active, so this answer is synthetic. Connect DEEPTUTOR_URL to route course Q&A into Guided Learning chat.",
      backendMode: "stub" as const,
    };
  }

  const sessionId = context.sessionId ?? courseId;
  let data: {
    response?: string;
    answer?: string;
    message?: string;
  };

  try {
    data = await fetchJson<{
      response?: string;
      answer?: string;
      message?: string;
    }>("/api/v1/guide/chat", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        message: question,
        knowledge_index:
          typeof context.knowledgeIndex === "number" ? context.knowledgeIndex : null,
      }),
    });
  } catch (error) {
    if (shouldUseLocalDeepTutorFallback(error)) {
      logStubResponse("askQuestion.fallback", {
        courseId,
        questionLength: question.length,
        reason: errorMessage(error),
      });

      return {
        answer:
          "Stub mode is active because the configured DeepTutor backend is unreachable in local development.",
        backendMode: "stub" as const,
      };
    }

    throw error;
  }

  return {
    answer: data.response ?? data.answer ?? data.message ?? "",
    backendMode: "live" as const,
  };
}

function stripJsonFence(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  const stripped = stripJsonFence(value);

  try {
    const parsed = JSON.parse(stripped) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    const firstBrace = stripped.indexOf("{");
    const lastBrace = stripped.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace <= firstBrace) return null;

    try {
      const parsed = JSON.parse(stripped.slice(firstBrace, lastBrace + 1)) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isSpecificText(value: unknown, minLength = 60) {
  const cleaned = text(value);
  return cleaned.length >= minLength && !hasGenericLessonSmell(cleaned);
}

function hasGenericLessonSmell(value: string) {
  const cleaned = value.toLowerCase();
  return [
    "before naming the rule",
    "lesson idea",
    "a lesson should earn",
    "invisible mechanism visible",
    "name the moving parts",
    "which answer wins",
    "hard situation easier to reason",
  ].some((phrase) => cleaned.includes(phrase));
}

function normalizeScriptStep(value: unknown): LessonScriptStepDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const kind = text(raw.kind);
  const allowedKinds = new Set(["hook", "concept", "example", "interactive"]);
  const body = text(raw.body);

  if (!allowedKinds.has(kind) || !isSpecificText(body, 80)) {
    return null;
  }

  return {
    kind: kind as LessonScriptStepDraft["kind"],
    title: text(raw.title),
    body,
  };
}

function normalizeScriptDraft(value: Record<string, unknown> | null): LessonScriptDraft | null {
  if (!value) return null;
  const rawSteps = Array.isArray(value.steps) ? value.steps : [];
  const steps = rawSteps.map(normalizeScriptStep).filter((step): step is LessonScriptStepDraft => Boolean(step));

  const rawInteractive =
    value.interactive && typeof value.interactive === "object" && !Array.isArray(value.interactive)
      ? (value.interactive as Record<string, unknown>)
      : null;
  const rawItems = Array.isArray(rawInteractive?.items) ? rawInteractive.items : [];
  const items = rawItems
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => {
      const raw = item as Record<string, unknown>;
      return {
        id: text(raw.id) || `item-${index + 1}`,
        label: text(raw.label) || `Part ${index + 1}`,
        body: text(raw.body),
        matchId: text(raw.matchId) || undefined,
      };
    })
    .filter((item) => isSpecificText(item.body, 40))
    .slice(0, 4);

  const objective = isSpecificText(value.objective, 32) ? text(value.objective) : undefined;
  const interactive = items.length >= 2
    ? {
        kind: "compare" as const,
        prompt: isSpecificText(rawInteractive?.prompt, 24)
          ? text(rawInteractive?.prompt)
          : "Compare the cards and connect each one to the lesson.",
        items,
      }
    : undefined;

  if (!objective && !interactive && steps.length === 0) {
    return null;
  }

  return {
    objective,
    steps,
    interactive,
  };
}

async function generateLessonScript(
  context: GenerateExerciseContext,
): Promise<LessonScriptDraft | null> {
  if (!context.sessionId) return null;

  const prompt = [
    `Write the actual lesson content for "${context.lessonTitle}" in the course "${context.courseTitle}".`,
    context.lessonSummary ? `Course planner summary: ${context.lessonSummary}` : "",
    "Return ONLY valid JSON. Do not include markdown fences.",
    "The lesson must be concrete, accurate, and subject-specific. Do not describe how a lesson should work. Build intuition with short cases and visuals.",
    "Do not repeat the lesson title as if it were an explanation. Avoid generic phrases like 'moving parts', 'lesson idea', 'mechanism visible', or 'which answer wins'.",
    "Keep every body under 70 words. The UI will show one problem per screen, so never write lecture paragraphs.",
    "JSON shape:",
    `{"objective":"one sentence","steps":[{"kind":"hook","title":"first problem","body":"one or two short sentences"},{"kind":"concept","title":"pattern","body":"one or two short sentences"},{"kind":"example","title":"case","body":"one or two short sentences"},{"kind":"interactive","title":"compare","body":"one or two short sentences"}],"interactive":{"prompt":"one sentence","items":[{"id":"evidence","label":"Evidence","body":"specific card text"},{"id":"trap","label":"Trap","body":"specific card text"},{"id":"boundary","label":"Boundary","body":"specific card text"}]}}`,
  ]
    .filter(Boolean)
    .join("\n");

  const data = await fetchJson<{
    response?: string;
    answer?: string;
    message?: string;
  }>("/api/v1/guide/chat", {
    method: "POST",
    body: JSON.stringify({
      session_id: context.sessionId,
      message: prompt,
      knowledge_index:
        typeof context.knowledgeIndex === "number" ? context.knowledgeIndex : null,
    }),
  });

  return normalizeScriptDraft(parseJsonObject(data.response ?? data.answer ?? data.message ?? ""));
}

function normalizeGeneratedQuestion(value: unknown, index: number): LessonQuestionDraft | null {
  const container =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  const qaPair =
    container?.qa_pair && typeof container.qa_pair === "object" && !Array.isArray(container.qa_pair)
      ? (container.qa_pair as Record<string, unknown>)
      : container;
  const question = text(qaPair?.question);
  const rawOptions =
    qaPair?.options && typeof qaPair.options === "object" && !Array.isArray(qaPair.options)
      ? (qaPair.options as Record<string, unknown>)
      : null;
  const options = rawOptions
    ? Object.fromEntries(
        Object.entries(rawOptions)
          .filter(([, option]) => text(option).length > 0)
          .map(([key, option]) => [key, text(option)]),
      )
    : {};

  if (!question || Object.keys(options).length < 2) {
    return null;
  }

  return {
    title: index === 0 ? "Make a first guess" : `Problem ${index + 1}`,
    body:
      index === 0
        ? "Try this before reading a rule. Choose the explanation that fits best."
        : "Use the pattern you have built so far. Choose the stronger explanation.",
    question,
    options,
    correctAnswer:
      typeof qaPair?.correct_answer === "string"
        ? qaPair.correct_answer
        : typeof qaPair?.answer === "string"
          ? qaPair.answer
          : null,
    explanation:
      typeof qaPair?.explanation === "string"
        ? qaPair.explanation
        : "The strongest answer explains the evidence and the reason it matters.",
    hint: "Look for the answer that explains why, not just what.",
  };
}

export async function generateExercise(
  lessonId: string,
  userHistory: GenerateExerciseContext,
) {
  if (isStubMode()) {
    logStubResponse("generateExercise", {
      courseId: userHistory.courseId,
      lessonId,
      knowledgeBaseName: userHistory.knowledgeBaseName ?? null,
    });

    return {
      exercise: buildStubExercise(lessonId, userHistory),
      backendMode: "stub" as const,
      raw: { stub: true },
    };
  }

  const prompt = [
    `Create an adaptive Brilliant-style lesson sequence for "${userHistory.lessonTitle}" in the course "${userHistory.courseTitle}".`,
    userHistory.lessonSummary ? `Lesson summary: ${userHistory.lessonSummary}` : "",
    userHistory.recentPerformance?.length
      ? `Recent learner history: ${userHistory.recentPerformance.join(" ")}`
      : "",
    "Return 8 short multiple-choice questions that build the lesson concept-by-concept.",
    "Start with a pretest question before explanation. Then use tiny cases, prediction checks, boundary checks, and one final transfer checkpoint.",
    "Each question should fit on one screen, diagnose reasoning, and include a concise explanation for feedback.",
    "Do not write lecture paragraphs. Do not ask trivia or vocabulary-only questions.",
  ]
    .filter(Boolean)
    .join("\n");

  const lessonScript = await generateLessonScript(userHistory).catch((error: unknown) => {
    console.warn("[DeepTutor] lesson script generation failed; using fallback lesson script", {
      lessonId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  });

  let events: SseEnvelope[];

  try {
    events = await fetchSse("/api/v1/plugins/capabilities/deep_question/execute-stream", {
      content: prompt,
      tools: userHistory.knowledgeBaseName ? ["rag"] : [],
      knowledge_bases: userHistory.knowledgeBaseName ? [userHistory.knowledgeBaseName] : [],
      language: "en",
      config: {
        mode: "custom",
        topic: prompt,
        num_questions: 8,
        question_type: "choice",
      },
    });
  } catch (error) {
    if (shouldUseLocalDeepTutorFallback(error)) {
      logStubResponse("generateExercise.fallback", {
        courseId: userHistory.courseId,
        lessonId,
        reason: errorMessage(error),
      });

      return {
        exercise: buildStubExercise(lessonId, userHistory),
        backendMode: "stub" as const,
        raw: { stub: true, fallbackReason: errorMessage(error) },
      };
    }

    throw error;
  }

  const resultEvent = [...events].reverse().find((event) => event.event === "result");
  const question =
    ((resultEvent?.data.data as Record<string, unknown> | undefined)?.summary as Record<
      string,
      unknown
    > | undefined)?.results;

  const questionSet = Array.isArray(question)
    ? question
        .map((item, index) => normalizeGeneratedQuestion(item, index))
        .filter((item): item is LessonQuestionDraft => Boolean(item))
    : [];
  const firstQuestion = questionSet[0] ?? null;

  if (!firstQuestion?.question) {
    throw new DeepTutorClientError(
      `DeepTutor did not return a usable exercise for lesson ${lessonId}.`,
      null,
      resultEvent?.data,
    );
  }

  return {
    exercise: buildExerciseData({
      courseId: userHistory.courseId,
      lessonId,
      lessonTitle: userHistory.lessonTitle,
      courseTitle: userHistory.courseTitle,
      lessonSummary: userHistory.lessonSummary,
      lessonScript,
      questionSet,
      question: firstQuestion.question,
      options: firstQuestion.options ?? {
        A: "Use the evidence to explain the result.",
        B: "Repeat a familiar label.",
      },
      correctAnswer: firstQuestion.correctAnswer,
      explanation:
        typeof firstQuestion.explanation === "string"
          ? firstQuestion.explanation
          : "DeepTutor returned no explanation.",
      backendMode: "live",
    }),
    backendMode: "live" as const,
    raw: resultEvent?.data ?? {},
  };
}
