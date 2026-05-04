import "server-only";

import type {
  CourseCardData,
  CourseDetailData,
  CourseLevel,
  CourseWorkflowKind,
  CourseWorkStatus,
  ExerciseData,
  ExerciseOption,
  LessonInteractiveData,
  LessonStepData,
  LessonStepKind,
  LearningLevel,
  LessonNode,
  LessonState,
  MaterialItem,
} from "@/lib/mock-data";
import type { CourseArtifactKind } from "@/lib/course-artifacts";
import { getCourseArtifactOption, normalizeCourseArtifactKind } from "@/lib/course-artifacts";

export interface GuideKnowledgePoint {
  knowledge_title: string;
  knowledge_summary?: string;
  user_difficulty?: string;
}

export interface LessonScriptStepDraft {
  kind?: LessonStepKind;
  title?: string;
  body?: string;
  prompt?: string;
  hint?: string;
  interactive?: Partial<LessonInteractiveData>;
}

export interface LessonScriptDraft {
  objective?: string;
  steps?: LessonScriptStepDraft[];
  interactive?: Partial<LessonInteractiveData>;
}

export interface LessonQuestionDraft {
  title?: string;
  body?: string;
  question?: string;
  options?: Record<string, string>;
  correctAnswer?: string | null;
  explanation?: string;
  hint?: string;
}

export interface StoredCourse {
  id: string;
  clerkId: string;
  title: string;
  subject: string;
  difficulty: string;
  description: string;
  artifactKind?: CourseArtifactKind;
  sourceMode: "topic" | "upload";
  sourceIds: string[];
  knowledgeBaseName: string | null;
  deeptutorSessionId: string;
  deeptutorStatus: string;
  currentLessonIndex: number;
  currentLessonId: string | null;
  guidePayload: {
    success?: boolean;
    session_id?: string;
    total_points?: number;
    knowledge_points?: GuideKnowledgePoint[];
    page_statuses?: Record<string, string>;
    progress?: number;
  };
  backendMode: "live" | "stub";
  shareToken?: string | null;
  shareEnabled?: boolean;
  sharedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredExercise {
  id: string;
  courseId: string;
  clerkId: string;
  lessonId: string;
  payload: ExerciseData;
  backendMode: "live" | "stub";
  createdAt: string;
}

export interface StoredCourseAttempt {
  id: string;
  courseId: string;
  clerkId: string;
  workflowKind: CourseWorkflowKind;
  lessonId: string | null;
  unitId: string | null;
  selectedOptionId: string | null;
  isCorrect: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface StoredProjectSubmission {
  id: string;
  courseId: string;
  clerkId: string;
  unitId: string;
  response: string;
  checklist: string[];
  confidence: number;
  status: Extract<CourseWorkStatus, "submitted" | "complete">;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardViewData {
  userName: string;
  streakDays: number;
  insightTopic: string;
  continueCopy: string;
  continueCourseId: string | null;
  continueCourse: CourseCardData | null;
  courses: CourseCardData[];
}

export function toLessonId(courseId: string, index: number, title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${courseId}-${index + 1}-${slug || "lesson"}`;
}

function getKnowledgePoints(course: StoredCourse): GuideKnowledgePoint[] {
  return Array.isArray(course.guidePayload.knowledge_points)
    ? course.guidePayload.knowledge_points
    : [];
}

function getLessonState(course: StoredCourse, index: number): LessonState {
  if (index < course.currentLessonIndex) return "complete";
  if (index === course.currentLessonIndex) return "current";
  return "locked";
}

function getCourseProgress(course: StoredCourse, lessonCount: number): number {
  if (!lessonCount) return 0;

  const completedLessons = Math.min(course.currentLessonIndex, lessonCount);
  return Math.min(100, Math.round((completedLessons / lessonCount) * 100));
}

function getCourseLevel(difficulty: string): CourseLevel {
  if (difficulty === "Beginner" || difficulty === "Advanced") {
    return difficulty;
  }

  return "Intermediate";
}

function buildLessons(course: StoredCourse): LessonNode[] {
  return getKnowledgePoints(course).map((point, index) => ({
    id: toLessonId(course.id, index, point.knowledge_title),
    title: point.knowledge_title || `Lesson ${index + 1}`,
    summary:
      point.knowledge_summary ||
      point.user_difficulty ||
      "Generated from DeepTutor guided learning.",
    state: getLessonState(course, index),
    xp: 40 + index * 10,
    duration: "15 min",
  }));
}

function formatEstimatedDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m estimate`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes
    ? `${hours}h ${remainingMinutes}m estimate`
    : `${hours}h estimate`;
}

function chunkLessons(lessons: LessonNode[], size = 3): LearningLevel[] {
  const levels: LearningLevel[] = [];

  for (let index = 0; index < lessons.length; index += size) {
    const chunk = lessons.slice(index, index + size);
    const completed = chunk.filter((lesson) => lesson.state === "complete").length;
    const current = chunk.some((lesson) => lesson.state === "current");
    const completion = chunk.length
      ? Math.round(((completed + (current ? 0.5 : 0)) / chunk.length) * 100)
      : 0;

    levels.push({
      id: `unit-${Math.floor(index / size) + 1}`,
      title: `Unit ${Math.floor(index / size) + 1}`,
      description: chunk[0]?.summary || "Guided lesson cluster generated by DeepTutor.",
      completion,
      mastery: Math.min(100, Math.round(completion * 0.85 + (current ? 8 : 0))),
      reviewDue: chunk.filter((lesson) => lesson.state === "complete").length > 1 ? 1 : 0,
      projectTitle: `Apply ${chunk[0]?.title || "this unit"} in a short scenario`,
      lessons: chunk,
    });
  }

  return levels;
}

function buildMaterials(course: StoredCourse): MaterialItem[] {
  if (course.sourceMode === "upload") {
    return course.sourceIds.map((sourceId, index) => ({
      label: index === 0 ? "Knowledge base" : `Source ${index + 1}`,
      type: "Upload",
      detail: sourceId,
    }));
  }

  return [
    {
      label: "Prompt",
      type: "Topic",
      detail: course.description,
    },
  ];
}

export function toCourseCardData(course: StoredCourse): CourseCardData {
  const lessons = buildLessons(course);
  const lessonCount = lessons.length;
  const lessonsComplete = lessons.filter((lesson) => lesson.state === "complete").length;
  const currentLesson =
    lessons.find((lesson) => lesson.state === "current") ?? lessons[0] ?? null;
  const artifact = getCourseArtifactOption(course.artifactKind);
  const estimatedMinutes = Math.max(1, lessonCount) * 20;

  return {
    id: course.id,
    title: course.title,
    subject: course.subject,
    description: course.description,
    progress: getCourseProgress(course, lessonCount),
    lessonsComplete,
    lessonCount,
    duration: formatEstimatedDuration(estimatedMinutes),
    intensity: artifact.title,
    weakness: currentLesson?.title || "Foundational review",
    sourceLabel:
      course.sourceMode === "upload"
        ? course.knowledgeBaseName || "Uploaded source"
        : "Topic prompt",
  };
}

export function toCourseDetailData(course: StoredCourse): CourseDetailData {
  const card = toCourseCardData(course);
  const lessons = buildLessons(course);
  const learningPath = chunkLessons(lessons);
  const progress = getCourseProgress(course, lessons.length);
  const masteryPercent = progress === 100 ? 100 : Math.min(96, Math.round(progress * 0.86));

  return {
    ...card,
    level: getCourseLevel(course.difficulty),
    streak: 0,
    hoursInvested: 0,
    masteryPercent,
    reviewDueCount: learningPath.reduce((total, level) => total + (level.reviewDue ?? 0), 0),
    projectCount: learningPath.length,
    materials: buildMaterials(course),
    learningPath,
    artifactKind: normalizeCourseArtifactKind(course.artifactKind),
    artifactTitle: getCourseArtifactOption(course.artifactKind).title,
    artifactAction: getCourseArtifactOption(course.artifactKind).dashboardAction,
    artifactPreviewTitle: getCourseArtifactOption(course.artifactKind).previewTitle,
  };
}

export function findLesson(course: StoredCourse, lessonId: string) {
  return buildLessons(course).find((lesson) => lesson.id === lessonId) ?? null;
}

export function getLessonIndexById(course: StoredCourse, lessonId: string) {
  return buildLessons(course).findIndex((lesson) => lesson.id === lessonId);
}

export function getLessonIdByIndex(course: StoredCourse, index: number) {
  return buildLessons(course)[index]?.id ?? null;
}

function getInteractionKind(seed: string): LessonInteractiveData["kind"] {
  const kinds: LessonInteractiveData["kind"][] = ["compare", "reveal", "sort", "slider", "match"];
  const score = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return kinds[score % kinds.length] ?? "compare";
}

function isMeaningfulText(value: unknown, minLength = 32) {
  return typeof value === "string" && value.trim().length >= minLength;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function compactText(value: unknown, fallback: string, maxLength = 220) {
  const cleaned = cleanText(value).replace(/\s+/g, " ");
  const source = cleaned || fallback;

  if (source.length <= maxLength) {
    return source;
  }

  const clipped = source.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");

  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : clipped.length).trim()}.`;
}

function normalizeLessonTopic(title: string, courseTitle?: string) {
  const cleaned = cleanText(title)
    .replace(/\s+/g, " ")
    .replace(/^lesson\s+\d+\s*[:.-]\s*/i, "");

  if (cleaned.includes(":")) {
    const [subject, focus] = cleaned.split(":").map((part) => part.trim());
    if (subject && focus) return `${focus} in ${subject}`;
  }

  return cleaned || cleanText(courseTitle) || "this topic";
}

function normalizeInteractiveDraft(
  draft: Partial<LessonInteractiveData> | undefined,
  fallback: LessonInteractiveData,
): LessonInteractiveData {
  if (!draft || !Array.isArray(draft.items) || draft.items.length < 2) {
    return fallback;
  }

  const items = draft.items
    .filter((item) => isMeaningfulText(item.body, 24))
    .slice(0, 4)
    .map((item, index) => ({
      id: cleanText(item.id) || `item-${index + 1}`,
      label: cleanText(item.label) || `Part ${index + 1}`,
      body: cleanText(item.body),
      matchId: cleanText(item.matchId) || undefined,
    }));

  return items.length >= 2
    ? {
        kind: draft.kind ?? fallback.kind,
        prompt: isMeaningfulText(draft.prompt, 16) ? cleanText(draft.prompt) : fallback.prompt,
        items,
        minLabel: cleanText(draft.minLabel) || fallback.minLabel,
        maxLabel: cleanText(draft.maxLabel) || fallback.maxLabel,
      }
    : fallback;
}

function normalizeExerciseOptions(options: Record<string, string>): ExerciseOption[] {
  const entries = Object.entries(options)
    .filter(([, value]) => isMeaningfulText(value, 8))
    .slice(0, 6);

  const normalizedEntries = entries.length >= 2
    ? entries
    : [
        ["A", "The answer that explains the evidence and its cause."],
        ["B", "The answer that only repeats a familiar label."],
      ];

  return normalizedEntries.map(([key, value], index) => {
    const label = cleanText(key) || String.fromCharCode(65 + index);

    return {
      id: label,
      label,
      body: compactText(value, "Choose the answer that explains the evidence.", 240),
    };
  });
}

function findCorrectOption(options: ExerciseOption[], correctAnswer?: string | null) {
  const normalizedAnswer = correctAnswer?.trim().toLowerCase() ?? "";

  if (!normalizedAnswer) {
    return options[0] ?? null;
  }

  return (
    options.find(
      (option) =>
        option.id.toLowerCase() === normalizedAnswer ||
        option.label.toLowerCase() === normalizedAnswer ||
        option.body.trim().toLowerCase() === normalizedAnswer ||
        `option ${option.id.toLowerCase()}` === normalizedAnswer ||
        normalizedAnswer.startsWith(`${option.id.toLowerCase()}.`) ||
        normalizedAnswer.startsWith(`${option.id.toLowerCase()})`),
    ) ?? options[0] ?? null
  );
}

function withOptionFeedback(
  options: ExerciseOption[],
  correctOptionId: string,
  explanation: string,
  hint: string,
) {
  return options.map((option) => ({
    ...option,
    feedback:
      option.id === correctOptionId
        ? compactText(explanation, "Yes. This choice explains why the result follows.", 260)
        : compactText(
            hint,
            "Not quite. This choice sounds plausible, but it does not explain the cause well enough.",
            240,
          ),
  }));
}

function buildFallbackQuestionDrafts(input: {
  lessonTitle: string;
  courseTitle?: string;
  lessonSummary: string;
  explanation: string;
}): LessonQuestionDraft[] {
  const topic = normalizeLessonTopic(input.lessonTitle, input.courseTitle);
  const summary = compactText(input.lessonSummary, `Use ${topic} by checking the evidence first.`, 180);
  const explanation = compactText(input.explanation, summary, 200);
  const optionSet = (correct: string, trap: string): Record<string, string> => ({
    A: correct,
    B: trap,
    C: `Pick the answer with the most familiar words from ${topic}.`,
    D: "Skip the evidence and trust the first impression.",
  });

  return [
    {
      title: "Make a first guess",
      body: "Try the smallest version before reading a rule.",
      question: `What is the best first move when you meet ${topic}?`,
      options: optionSet(
        `Look for the evidence that shows what changed and why.`,
        `Start by memorizing the name of ${topic}.`,
      ),
      correctAnswer: "A",
      explanation: summary,
      hint: "The first move is to inspect the evidence, not to memorize the label.",
    },
    {
      title: "Find the evidence",
      body: "Now choose the answer that uses evidence instead of a slogan.",
      question: `Which answer would make ${topic} useful in a new case?`,
      options: optionSet(summary, "It repeats the title without explaining the case."),
      correctAnswer: "A",
      explanation: summary,
      hint: "A useful answer would still help if the wording changed.",
    },
    {
      title: "Compare explanations",
      body: "Reveal the cards, then choose the explanation that predicts the result.",
      question: `Which explanation best predicts what happens in ${topic}?`,
      options: optionSet(explanation, "It treats the lesson as a vocabulary check."),
      correctAnswer: "A",
      explanation,
      hint: "Prediction beats vocabulary here.",
    },
    {
      title: "Spot the trap",
      body: "One answer sounds fluent but does not explain the cause.",
      question: `What is the tempting mistake when reasoning about ${topic}?`,
      options: optionSet(
        "Treating a label as an explanation.",
        "Checking whether the evidence supports the conclusion.",
      ),
      correctAnswer: "A",
      explanation: "The trap is choosing language that sounds right while skipping the causal link.",
      hint: "The trap usually sounds polished, but it cannot predict anything.",
    },
    {
      title: "Name the rule",
      body: "Only name the idea after the case already makes sense.",
      question: `Which statement turns ${topic} into a rule you can reuse?`,
      options: optionSet(
        `${summary} Use that pattern when a new case has the same structure.`,
        "The right rule is whatever phrase appeared most often in the lesson title.",
      ),
      correctAnswer: "A",
      explanation: "A reusable rule names the condition, the action, and the limit.",
      hint: "A reusable rule works outside this exact wording.",
    },
    {
      title: "Check the boundary",
      body: "Strong ideas also tell you where they stop applying.",
      question: `When should you be careful applying ${topic}?`,
      options: optionSet(
        "When the evidence no longer has the same cause-and-effect structure.",
        "Never; once a rule is named, it applies everywhere.",
      ),
      correctAnswer: "A",
      explanation: "A boundary keeps the idea from becoming an overgeneralized slogan.",
      hint: "Look for the answer that limits the rule.",
    },
    {
      title: "Transfer it",
      body: "Try moving the idea to a neighboring case.",
      question: `What would count as successful transfer for ${topic}?`,
      options: optionSet(
        "You can explain a new case using the same evidence-to-cause pattern.",
        "You can recite the same sentence without changing it.",
      ),
      correctAnswer: "A",
      explanation: "Transfer means the pattern survives a change in surface details.",
      hint: "Transfer is about use, not recital.",
    },
    {
      title: "Final check",
      body: "Lock it in with one clean answer.",
      question: `Which answer best shows you understand ${topic}?`,
      options: optionSet(explanation, "It gives a confident label but no evidence."),
      correctAnswer: "A",
      explanation,
      hint: "Choose the answer that explains why, not just what.",
    },
  ];
}

function normalizeQuestionDraft(
  draft: LessonQuestionDraft,
  index: number,
  topic: string,
): {
  title: string;
  body: string;
  prompt: string;
  options: ExerciseOption[];
  correctOptionId: string;
  explanation: string;
  hint: string;
} | null {
  const prompt = compactText(draft.question, "", 260);

  if (!isMeaningfulText(prompt, 16)) {
    return null;
  }

  const rawOptions = draft.options ?? {};
  const options = normalizeExerciseOptions(rawOptions);
  const correctOption = findCorrectOption(options, draft.correctAnswer);

  if (!correctOption) {
    return null;
  }

  const explanation = compactText(
    draft.explanation,
    "The strongest answer explains the evidence, the cause, and the boundary.",
    260,
  );
  const hint = compactText(
    draft.hint,
    `Look for the choice that makes ${topic} usable in a new case.`,
    220,
  );

  return {
    title: compactText(draft.title, `Problem ${index + 1}`, 72),
    body: compactText(
      draft.body,
      index === 0
        ? "Try this before the rule. Pick the answer that best explains the case."
        : "Use the pattern from the previous screen, then choose the stronger explanation.",
      220,
    ),
    prompt,
    options: withOptionFeedback(options, correctOption.id, explanation, hint),
    correctOptionId: correctOption.id,
    explanation,
    hint,
  };
}

export function toDashboardViewData(courses: StoredCourse[]): DashboardViewData {
  const mappedCourses = courses.map(toCourseCardData);
  const continueCourse = mappedCourses[0] ?? null;
  const insightTopic = continueCourse?.weakness || "your current lesson";

  return {
    userName: "there",
    streakDays: 0,
    insightTopic,
    continueCopy: continueCourse
      ? `Next up: ${continueCourse.weakness}. DeepTutor already shaped the next exercise around it.`
      : "Create your first course and the dashboard will start tracking your next move.",
    continueCourseId: continueCourse?.id ?? null,
    continueCourse,
    courses: mappedCourses,
  };
}

export function buildExerciseData(input: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle?: string;
  lessonSummary?: string;
  lessonScript?: LessonScriptDraft | null;
  questionSet?: LessonQuestionDraft[];
  question: string;
  options: Record<string, string>;
  explanation: string;
  correctAnswer?: string | null;
  backendMode: "live" | "stub";
}): ExerciseData {
  const lessonSummary =
    input.lessonSummary?.trim() ||
    `Build a working mental model for ${input.lessonTitle} before answering the checkpoint.`;
  const topic = normalizeLessonTopic(input.lessonTitle, input.courseTitle);
  const baseQuestion: LessonQuestionDraft = {
    title: "Make a first guess",
    body: "Try this before reading more. Pick the answer that best explains the case.",
    question: input.question,
    options: input.options,
    correctAnswer: input.correctAnswer,
    explanation: input.explanation,
    hint: input.explanation,
  };
  const fallbackQuestions = buildFallbackQuestionDrafts({
    lessonTitle: input.lessonTitle,
    courseTitle: input.courseTitle,
    lessonSummary,
    explanation: input.explanation,
  });
  const candidateQuestions = [
    ...(input.questionSet?.length ? input.questionSet : [baseQuestion]),
    ...fallbackQuestions,
  ];
  const seenPrompts = new Set<string>();
  const lessonQuestions = candidateQuestions
    .map((question, index) => normalizeQuestionDraft(question, index, topic))
    .filter((question): question is NonNullable<typeof question> => {
      if (!question) return false;
      const key = question.prompt.toLowerCase();
      if (seenPrompts.has(key)) return false;
      seenPrompts.add(key);
      return true;
    })
    .slice(0, 8);
  const completedQuestions = lessonQuestions.length >= 8
    ? lessonQuestions
    : [
        ...lessonQuestions,
        ...fallbackQuestions
          .map((question, index) => normalizeQuestionDraft(question, lessonQuestions.length + index, topic))
          .filter((question): question is NonNullable<typeof question> => Boolean(question))
          .slice(0, 8 - lessonQuestions.length),
      ];
  const finalQuestion = completedQuestions[completedQuestions.length - 1] ??
    normalizeQuestionDraft(baseQuestion, 0, topic);
  const interactionKind = getInteractionKind(`${input.lessonId}:${input.lessonTitle}`);
  const fallbackInteraction: LessonInteractiveData = {
    kind: interactionKind,
    prompt:
      interactionKind === "slider"
        ? "Move the control to see when the explanation becomes precise enough to trust."
        : interactionKind === "sort"
          ? "Read the cards in order, then choose the answer that follows from them."
          : "Tap each card, then choose the answer that explains the case.",
    items: [
      {
        id: interactionKind === "sort" ? "step-1" : "mechanism",
        label: interactionKind === "sort" ? "1. Evidence" : "Evidence",
        body: compactText(lessonSummary, `The key evidence for ${topic}.`, 180),
        matchId: "mechanism",
      },
      {
        id: interactionKind === "sort" ? "step-2" : "misconception",
        label: interactionKind === "sort" ? "2. Trap" : "Trap",
        body: "A fluent label can still fail if it does not explain the evidence.",
        matchId: "trap",
      },
      {
        id: interactionKind === "sort" ? "step-3" : "boundary",
        label: interactionKind === "sort" ? "3. Boundary" : "Boundary",
        body: compactText(input.explanation, "The idea only applies when the same causal pattern is present.", 180),
        matchId: "boundary",
      },
    ],
    minLabel: "Vague",
    maxLabel: "Precise",
  };
  const interaction = normalizeInteractiveDraft(input.lessonScript?.interactive, fallbackInteraction);
  const kindByIndex: LessonStepKind[] = [
    "hook",
    "practice",
    "interactive",
    "practice",
    "concept",
    "practice",
    "reflection",
    "checkpoint",
  ];
  const steps: LessonStepData[] = completedQuestions.map((question, index) => ({
    id: `${input.lessonId}-level-${index + 1}`,
    kind: kindByIndex[index] ?? (index === completedQuestions.length - 1 ? "checkpoint" : "practice"),
    title: question.title,
    body: question.body,
    prompt: question.prompt,
    options: question.options,
    correctOptionId: question.correctOptionId,
    hint: question.hint,
    explanation: question.explanation,
    interactive: index === 2 ? interaction : undefined,
  }));
  const checkpointStep = steps[steps.length - 1];

  return {
    courseId: input.courseId,
    lessonId: input.lessonId,
    title: input.lessonTitle,
    subtitle: "Interactive lesson",
    objective: isMeaningfulText(input.lessonScript?.objective, 24)
      ? cleanText(input.lessonScript?.objective)
      : `Solve short cases that build ${topic} through prediction and feedback.`,
    prompt: checkpointStep?.prompt ?? finalQuestion?.prompt ?? input.question,
    step: steps.length,
    stepCount: steps.length,
    xp: input.backendMode === "stub" ? 30 : 50,
    options: checkpointStep?.options ?? finalQuestion?.options ?? normalizeExerciseOptions(input.options),
    correctOptionId: checkpointStep?.correctOptionId ?? finalQuestion?.correctOptionId,
    explanation: checkpointStep?.explanation ?? input.explanation,
    hint: checkpointStep?.hint ?? input.explanation,
    steps,
    checkpointStepId: checkpointStep?.id ?? `${input.lessonId}-level-${steps.length}`,
  };
}
