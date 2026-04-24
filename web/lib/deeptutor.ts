import "server-only";

import { randomUUID } from "node:crypto";
import { buildExerciseData, type GuideKnowledgePoint } from "@/lib/course-data";
import { getDeepTutorAuthHeaders, getDeepTutorUrl } from "@/lib/deeptutor-config";

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

function buildStubKnowledgePoints(title: string): GuideKnowledgePoint[] {
  return [
    {
      knowledge_title: `${title}: foundations`,
      knowledge_summary: "Establish the vocabulary and baseline intuition for the topic.",
    },
    {
      knowledge_title: `${title}: patterns`,
      knowledge_summary: "Work through recurring structures and compare similar cases.",
    },
    {
      knowledge_title: `${title}: application`,
      knowledge_summary: "Apply the concept to a concrete task and explain the reasoning.",
    },
  ];
}

function buildStubExercise(lessonId: string, context: GenerateExerciseContext) {
  return buildExerciseData({
    courseId: context.courseId,
    lessonId,
    lessonTitle: context.lessonTitle,
    question: `Which statement best captures the core idea behind ${context.lessonTitle}?`,
    options: {
      A: "It is only a memorization trick with no reusable structure.",
      B: "It is the most concrete example of the concept in action.",
      C: "It shows how the concept behaves, why it matters, and where it breaks.",
      D: "It replaces the rest of the course and makes later lessons unnecessary.",
    },
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

    return {
      id: `stub-source-${randomUUID()}`,
      knowledgeBaseName: buildKnowledgeBaseName(file.name, userId),
      taskId: null,
      backendMode: "stub",
      note: "Stubbed because DEEPTUTOR_URL is not configured.",
    };
  }

  const knowledgeBaseName = buildKnowledgeBaseName(file.name, userId);
  const formData = new FormData();
  formData.set("name", knowledgeBaseName);
  formData.append("files", file);

  const data = await fetchJson<{
    task_id?: string;
    message?: string;
  }>("/api/v1/knowledge/create", {
    method: "POST",
    body: formData,
    headers: getDeepTutorHeaders(),
  });

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

    const sessionId = `stub-session-${randomUUID()}`;
    const knowledgePoints = buildStubKnowledgePoints(params.title);

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
  const data = await fetchJson<{
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

  return {
    answer: data.response ?? data.answer ?? data.message ?? "",
    backendMode: "live" as const,
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
    `Create one adaptive multiple-choice exercise for the lesson "${userHistory.lessonTitle}" in the course "${userHistory.courseTitle}".`,
    userHistory.lessonSummary ? `Lesson summary: ${userHistory.lessonSummary}` : "",
    userHistory.recentPerformance?.length
      ? `Recent learner history: ${userHistory.recentPerformance.join(" ")}`
      : "",
    "Keep the question focused, concept-checking, and suitable for a single lesson step.",
  ]
    .filter(Boolean)
    .join("\n");

  const events = await fetchSse("/api/v1/plugins/capabilities/deep_question/execute-stream", {
    content: prompt,
    tools: userHistory.knowledgeBaseName ? ["rag"] : [],
    knowledge_bases: userHistory.knowledgeBaseName ? [userHistory.knowledgeBaseName] : [],
    language: "en",
    config: {
      mode: "custom",
      topic: prompt,
      num_questions: 1,
      question_type: "choice",
    },
  });

  const resultEvent = [...events].reverse().find((event) => event.event === "result");
  const question =
    ((resultEvent?.data.data as Record<string, unknown> | undefined)?.summary as Record<
      string,
      unknown
    > | undefined)?.results;

  const firstResult = Array.isArray(question) ? question[0] : null;
  const qaPair =
    firstResult && typeof firstResult === "object"
      ? (firstResult as { qa_pair?: Record<string, unknown> }).qa_pair
      : null;

  if (!qaPair || typeof qaPair.question !== "string") {
    throw new DeepTutorClientError(
      `DeepTutor did not return a usable exercise for lesson ${lessonId}.`,
      null,
      resultEvent?.data,
    );
  }

  const options =
    qaPair.options && typeof qaPair.options === "object"
      ? (qaPair.options as Record<string, string>)
      : {
          A: "Review the lesson again.",
          B: "Practice with a worked example.",
          C: "Connect the concept to its purpose.",
          D: "Skip ahead to the next topic.",
        };

  return {
    exercise: buildExerciseData({
      courseId: userHistory.courseId,
      lessonId,
      lessonTitle: userHistory.lessonTitle,
      question: qaPair.question,
      options,
      explanation:
        typeof qaPair.explanation === "string" ? qaPair.explanation : "DeepTutor returned no explanation.",
      backendMode: "live",
    }),
    backendMode: "live" as const,
    raw: resultEvent?.data ?? {},
  };
}
