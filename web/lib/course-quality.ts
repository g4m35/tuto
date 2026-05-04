import type { ExerciseData, LessonStepData } from "@/lib/mock-data";

export interface CourseLessonQualityCheck {
  id: string;
  label: string;
  passed: boolean;
}

export interface CourseLessonQualityReport {
  ok: boolean;
  score: number;
  checks: CourseLessonQualityCheck[];
}

function hasMeaningfulText(value: unknown) {
  return typeof value === "string" && value.trim().length >= 24;
}

function hasCompactText(value: unknown, maxLength = 420) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isProblemStep(step: LessonStepData) {
  return (
    hasMeaningfulText(step.prompt) &&
    (step.options?.length ?? 0) >= 2 &&
    typeof step.correctOptionId === "string" &&
    step.correctOptionId.trim().length > 0
  );
}

function hasTemplateLeak(value: string) {
  const lower = value.toLowerCase();
  return [
    "before naming the rule",
    "lesson idea",
    "a lesson should earn",
    "invisible mechanism visible",
    "name the moving parts",
    "which answer wins",
    "hard situation easier to reason",
  ].some((phrase) => lower.includes(phrase));
}

export function evaluateCourseLessonQuality(exercise: ExerciseData): CourseLessonQualityReport {
  const steps = Array.isArray(exercise.steps) ? exercise.steps : [];
  const checkpointStep = steps.find(
    (step) => step.id === exercise.checkpointStepId || step.kind === "checkpoint",
  );
  const problemSteps = steps.filter(isProblemStep);
  const firstProblemIndex = steps.findIndex(isProblemStep);
  const interactionStep = steps.find((step) => step.kind === "interactive" && step.interactive);
  const visibleLessonText = [
    exercise.objective,
    exercise.title,
    ...steps.flatMap((step) => [step.title, step.body, step.takeaway, step.prompt, step.hint]),
  ]
    .filter(Boolean)
    .join("\n");
  const checks: CourseLessonQualityCheck[] = [
    {
      id: "problem-sequence",
      label: "Includes a multi-screen problem sequence",
      passed: steps.length >= 8 && problemSteps.length >= 6,
    },
    {
      id: "pretest-first",
      label: "Starts with a problem before lecture",
      passed: firstProblemIndex >= 0 && firstProblemIndex <= 1,
    },
    {
      id: "compact-screens",
      label: "Uses compact screen-sized text",
      passed:
        steps.length > 0 &&
        steps.every((step) =>
          hasCompactText(step.title, 72) &&
          hasCompactText(step.body, 420) &&
          (!step.prompt || hasCompactText(step.prompt, 260)),
        ),
    },
    {
      id: "specificity",
      label: "Avoids generic lesson-template copy",
      passed: !hasTemplateLeak(visibleLessonText),
    },
    {
      id: "interactive-component",
      label: "Includes an interactive component",
      passed:
        !!interactionStep?.interactive?.prompt &&
        (interactionStep.interactive.items?.length ?? 0) >= 2,
    },
    {
      id: "checkpoint",
      label: "Includes a checkpoint with answer options",
      passed:
        !!checkpointStep &&
        isProblemStep(checkpointStep) &&
        (checkpointStep.options?.some((option) => option.id === checkpointStep.correctOptionId) ?? false),
    },
    {
      id: "feedback",
      label: "Includes feedback for problem attempts",
      passed:
        problemSteps.length > 0 &&
        problemSteps.every((step) => hasMeaningfulText(step.explanation) || hasMeaningfulText(step.hint)),
    },
  ];
  const passedCount = checks.filter((check) => check.passed).length;

  return {
    ok: checks.every((check) => check.passed),
    score: Math.round((passedCount / checks.length) * 100),
    checks,
  };
}
