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

function buildFallbackLessonSteps(input: {
  lessonTitle: string;
  courseTitle?: string;
  lessonSummary: string;
  explanation: string;
  interaction: LessonInteractiveData;
}): LessonStepData[] {
  const topic = normalizeLessonTopic(input.lessonTitle, input.courseTitle);
  const lowerContext = `${input.lessonTitle} ${input.courseTitle ?? ""} ${input.lessonSummary}`.toLowerCase();

  if (lowerContext.includes("hockey")) {
    return [
      {
        id: "hook",
        kind: "hook",
        title: "What hockey is trying to do",
        body:
          "Hockey is a fast invasion game: one team tries to move the puck into the opponent's net while the other team protects space, wins the puck back, and starts its own attack. The foundations are the rules and habits that keep that speed organized.",
      },
      {
        id: "concept",
        kind: "concept",
        title: "The core loop",
        body:
          "A hockey shift is built around four repeating jobs: gain possession, create skating or passing space, turn that space into a shot chance, then recover defensively if the puck changes hands. For beginners, most plays make sense when you ask who has the puck, where the open ice is, and whether the defending team is protecting the middle of the ice.",
      },
      {
        id: "example",
        kind: "example",
        title: "A simple rush",
        body:
          "Imagine a winger carrying the puck through the neutral zone. A teammate must wait until the puck crosses the attacking blue line before entering the offensive zone, or the play is offside. Once the puck is in legally, the puck carrier can shoot, pass to the slot, or send the puck deep so teammates can chase and pressure the defense.",
      },
      {
        id: "interactive",
        kind: "interactive",
        title: "Compare the parts",
        body:
          "Use the cards to separate the three foundations that beginners mix together: the objective of the game, the roles players use to create structure, and the boundary rules that stop unfair attacking advantages.",
        interactive: {
          ...input.interaction,
          prompt: "Reveal each card and connect it to what you would watch for during a real shift.",
          items: [
            {
              id: "objective",
              label: "Objective",
              body: "Create a better scoring chance than the other team by moving the puck into dangerous ice and shooting on net.",
              matchId: "objective",
            },
            {
              id: "roles",
              label: "Roles",
              body: "Forwards pressure and create chances, defensemen protect space and move the puck, and the goalie protects the net.",
              matchId: "roles",
            },
            {
              id: "rules",
              label: "Boundaries",
              body: "Offside, icing, penalties, and faceoffs keep the game fair and reset play when a team gains an illegal advantage.",
              matchId: "rules",
            },
          ],
        },
      },
    ];
  }

  return [
    {
      id: "hook",
      kind: "hook",
      title: "What this lesson answers",
      body: `This lesson turns ${topic} into something you can use. By the end, you should be able to explain the idea, recognize it in a simple situation, and avoid the most tempting wrong interpretation.`,
    },
    {
      id: "concept",
      kind: "concept",
      title: "Core idea",
      body: input.lessonSummary,
    },
    {
      id: "example",
      kind: "example",
      title: "A worked example",
      body: `Use this concrete pattern for ${topic}: identify the situation, decide which rule or relationship applies, predict the result, then compare that result with the explanation. ${input.explanation}`,
    },
    {
      id: "interactive",
      kind: "interactive",
      title: "Check the boundaries",
      body:
        "Use the cards to compare the main idea, a tempting mistake, and the limit where the idea stops applying cleanly.",
      interactive: input.interaction,
    },
  ];
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

function applyLessonScriptDraft(
  fallbackSteps: LessonStepData[],
  draft: LessonScriptDraft | null | undefined,
  fallbackInteractive: LessonInteractiveData,
): LessonStepData[] {
  if (!draft || !Array.isArray(draft.steps)) {
    return fallbackSteps;
  }

  return fallbackSteps.map((fallbackStep) => {
    const drafted = draft.steps?.find((step) => step.kind === fallbackStep.kind);
    const body = cleanText(drafted?.body);

    if (!isMeaningfulText(body, fallbackStep.kind === "hook" ? 60 : 80)) {
      return fallbackStep;
    }

    const interactive =
      fallbackStep.kind === "interactive"
        ? normalizeInteractiveDraft(draft.interactive ?? drafted?.interactive, fallbackInteractive)
        : fallbackStep.interactive;

    return {
      ...fallbackStep,
      title: cleanText(drafted?.title) || fallbackStep.title,
      body,
      prompt: isMeaningfulText(drafted?.prompt, 16) ? cleanText(drafted?.prompt) : fallbackStep.prompt,
      hint: isMeaningfulText(drafted?.hint, 16) ? cleanText(drafted?.hint) : fallbackStep.hint,
      interactive,
    };
  });
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
  question: string;
  options: Record<string, string>;
  explanation: string;
  correctAnswer?: string | null;
  backendMode: "live" | "stub";
}): ExerciseData {
  const options: ExerciseOption[] = Object.entries(input.options).map(([key, value]) => ({
    id: key,
    label: key,
    body: value,
  }));
  const normalizedAnswer = input.correctAnswer?.trim().toLowerCase() ?? "";
  const correctOption = normalizedAnswer
    ? options.find(
        (option) =>
          option.id.toLowerCase() === normalizedAnswer ||
          option.label.toLowerCase() === normalizedAnswer ||
          option.body.trim().toLowerCase() === normalizedAnswer ||
          `option ${option.id.toLowerCase()}` === normalizedAnswer ||
          normalizedAnswer.startsWith(`${option.id.toLowerCase()}.`) ||
          normalizedAnswer.startsWith(`${option.id.toLowerCase()})`),
      )
    : null;
  const lessonSummary =
    input.lessonSummary?.trim() ||
    `Build a working mental model for ${input.lessonTitle} before answering the checkpoint.`;
  const correctOptionId = correctOption?.id ?? options[0]?.id;
  const checkpointOptions = options.map((option) => ({ ...option }));
  const misconception = options.find((option) => option.id !== correctOptionId);
  const interactionKind = getInteractionKind(`${input.lessonId}:${input.lessonTitle}`);
  const interaction: LessonInteractiveData = {
    kind: interactionKind,
    prompt:
      interactionKind === "slider"
        ? "Move the control to see how confidence changes as the idea becomes more precise."
        : interactionKind === "sort"
          ? "Read the cards in order, then reveal how the reasoning should flow."
          : "Tap each card to separate the durable idea from a tempting shortcut.",
    items: [
      {
        id: interactionKind === "sort" ? "step-1" : "mechanism",
        label: interactionKind === "sort" ? "1. Mechanism" : "Mechanism",
        body: lessonSummary,
        matchId: "mechanism",
      },
      {
        id: interactionKind === "sort" ? "step-2" : "misconception",
        label: interactionKind === "sort" ? "2. Trap" : "Trap",
        body:
          misconception?.body ||
          "Treating the lesson as a phrase to memorize instead of a tool to use.",
        matchId: "trap",
      },
      {
        id: interactionKind === "sort" ? "step-3" : "boundary",
        label: interactionKind === "sort" ? "3. Boundary" : "Boundary",
        body: input.explanation,
        matchId: "boundary",
      },
    ],
    minLabel: "Vague",
    maxLabel: "Precise",
  };
  const lessonSteps = applyLessonScriptDraft(
    buildFallbackLessonSteps({
      lessonTitle: input.lessonTitle,
      courseTitle: input.courseTitle,
      lessonSummary,
      explanation: input.explanation,
      interaction,
    }).map((step) => ({
      ...step,
      id: `${input.lessonId}-${step.id}`,
    })),
    input.lessonScript,
    interaction,
  );
  const steps: LessonStepData[] = [
    ...lessonSteps,
    {
      id: `${input.lessonId}-practice`,
      kind: "practice",
      title: "Try the question",
      body: "Say the answer in your own words first. Then choose the option that best explains the concept's behavior, purpose, and limits.",
      prompt: input.question,
      hint: input.explanation,
    },
    {
      id: `${input.lessonId}-checkpoint`,
      kind: "checkpoint",
      title: "Check your understanding",
      body: "Lock in the lesson by choosing the strongest explanation.",
      prompt: input.question,
      options: checkpointOptions,
      correctOptionId,
      explanation: input.explanation,
    },
  ];

  return {
    courseId: input.courseId,
    lessonId: input.lessonId,
    title: input.lessonTitle,
    subtitle: "Guided lesson",
    objective: isMeaningfulText(input.lessonScript?.objective, 24)
      ? cleanText(input.lessonScript?.objective)
      : `Understand and apply ${normalizeLessonTopic(input.lessonTitle, input.courseTitle)}.`,
    prompt: input.question,
    step: steps.length,
    stepCount: steps.length,
    xp: input.backendMode === "stub" ? 30 : 50,
    options,
    correctOptionId,
    explanation: input.explanation,
    hint: input.explanation || "Review the lesson summary, then eliminate the most obviously wrong option first.",
    steps,
    checkpointStepId: `${input.lessonId}-checkpoint`,
  };
}
