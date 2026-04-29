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

function hasStepKind(steps: LessonStepData[], kind: LessonStepData["kind"]) {
  return steps.some((step) => step.kind === kind);
}

export function evaluateCourseLessonQuality(exercise: ExerciseData): CourseLessonQualityReport {
  const steps = Array.isArray(exercise.steps) ? exercise.steps : [];
  const checkpointStep = steps.find(
    (step) => step.id === exercise.checkpointStepId || step.kind === "checkpoint",
  );
  const interactionStep = steps.find((step) => step.kind === "interactive" && step.interactive);
  const checks: CourseLessonQualityCheck[] = [
    {
      id: "lesson-script",
      label: "Includes a multi-step teaching script",
      passed: steps.length >= 5 && steps.every((step) => hasMeaningfulText(step.body)),
    },
    {
      id: "teaching-sequence",
      label: "Teaches before testing",
      passed:
        hasStepKind(steps, "hook") &&
        hasStepKind(steps, "concept") &&
        hasStepKind(steps, "example") &&
        hasStepKind(steps, "practice"),
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
        (checkpointStep.options?.length ?? exercise.options.length) >= 2 &&
        !!(checkpointStep.correctOptionId ?? exercise.correctOptionId),
    },
    {
      id: "feedback",
      label: "Includes feedback, hint, or explanation",
      passed:
        hasMeaningfulText(exercise.hint) ||
        hasMeaningfulText(exercise.explanation) ||
        steps.some((step) => hasMeaningfulText(step.explanation) || hasMeaningfulText(step.hint)),
    },
  ];
  const passedCount = checks.filter((check) => check.passed).length;

  return {
    ok: checks.every((check) => check.passed),
    score: Math.round((passedCount / checks.length) * 100),
    checks,
  };
}
