import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCourseLessonQuality } from "../lib/course-quality";
import type { ExerciseData, LessonStepData } from "../lib/mock-data";

function buildProblemSteps(count = 8): LessonStepData[] {
  return Array.from({ length: count }, (_, index) => {
    const isCheckpoint = index === count - 1;
    const optionA = `Use the evidence in case ${index + 1} to explain what changed and why.`;
    const optionB = `Memorize the label from case ${index + 1} without checking the cause.`;

    return {
      id: `lesson-quality-problem-${index + 1}`,
      kind: isCheckpoint ? "checkpoint" : index === 2 ? "interactive" : "practice",
      title: index === 0 ? "Make a first guess" : `Problem ${index + 1}`,
      body:
        index === 0
          ? "Start with the smallest case. Pick the explanation before reading a rule."
          : "Use the pattern you just tested. One option explains the cause; one only names it.",
      prompt: `In case ${index + 1}, which explanation best fits the evidence?`,
      hint: `Look for the option that explains the cause in case ${index + 1}.`,
      explanation: `The stronger answer for case ${index + 1} connects the evidence to the cause, then states the limit.`,
      correctOptionId: "a",
      options: [
        {
          id: "a",
          label: "A",
          body: optionA,
          feedback: `Correct: this uses the evidence from case ${index + 1} instead of naming a slogan.`,
        },
        {
          id: "b",
          label: "B",
          body: optionB,
          feedback: `This is the trap: it names the idea in case ${index + 1} without explaining the cause.`,
        },
      ],
      interactive:
        index === 2
          ? {
              kind: "compare",
              prompt: "Reveal the two explanations, then choose the one that predicts the result.",
              items: [
                { id: "cause", label: "Cause", body: "A causal explanation predicts what changes next." },
                { id: "label", label: "Label", body: "A label can sound right while explaining nothing." },
              ],
            }
          : undefined,
    };
  });
}

function buildQualityExercise(overrides: Partial<ExerciseData> = {}): ExerciseData {
  const steps = buildProblemSteps();
  const exercise: ExerciseData = {
    courseId: "course-quality",
    lessonId: "lesson-quality",
    title: "Quality lesson",
    subtitle: "Interactive lesson",
    objective: "Solve short cases that build the concept through prediction and feedback.",
    prompt: "In case 8, which explanation best fits the evidence?",
    step: steps.length,
    stepCount: steps.length,
    xp: 50,
    correctOptionId: "a",
    hint: "Choose the option that explains cause and boundary.",
    explanation: "The correct option connects evidence, cause, and boundary.",
    checkpointStepId: "lesson-quality-problem-8",
    options: [
      { id: "a", label: "A", body: "Use the evidence in case 8 to explain what changed and why." },
      { id: "b", label: "B", body: "Memorize the label from case 8 without checking the cause." },
    ],
    steps,
  };

  return { ...exercise, ...overrides };
}

test("evaluateCourseLessonQuality passes rich interactive lessons", () => {
  const report = evaluateCourseLessonQuality(buildQualityExercise());

  assert.equal(report.ok, true);
  assert.equal(report.score, 100);
});

test("evaluateCourseLessonQuality rejects thin quiz-only lessons", () => {
  const report = evaluateCourseLessonQuality(
    buildQualityExercise({
      steps: undefined,
      checkpointStepId: undefined,
    }),
  );

  assert.equal(report.ok, false);
  assert.equal(report.checks.find((check) => check.id === "problem-sequence")?.passed, false);
  assert.equal(report.checks.find((check) => check.id === "interactive-component")?.passed, false);
});

test("evaluateCourseLessonQuality rejects lessons with too few problem screens", () => {
  const report = evaluateCourseLessonQuality(
    buildQualityExercise({
      steps: buildProblemSteps(4),
      checkpointStepId: "lesson-quality-problem-4",
    }),
  );

  assert.equal(report.ok, false);
  assert.equal(report.checks.find((check) => check.id === "problem-sequence")?.passed, false);
});

test("evaluateCourseLessonQuality rejects lecture-style long prose blocks", () => {
  const exercise = buildQualityExercise();
  const report = evaluateCourseLessonQuality({
    ...exercise,
    steps: exercise.steps?.map((step, index) =>
      index === 1
        ? {
            ...step,
            body:
              "This is a long lecture block that keeps explaining and explaining before the learner has a chance to do anything. ".repeat(8),
          }
        : step,
    ),
  });

  assert.equal(report.ok, false);
  assert.equal(report.checks.find((check) => check.id === "compact-screens")?.passed, false);
});

test("evaluateCourseLessonQuality rejects generic lesson-template copy", () => {
  const exercise = buildQualityExercise();
  const report = evaluateCourseLessonQuality({
    ...exercise,
    steps: exercise.steps?.map((step) =>
      step.id === "lesson-quality-problem-3"
        ? {
            ...step,
            body:
              "Use this pattern: identify the situation, name the moving parts, predict what should happen, then check the result against the lesson idea. The important move is explaining why the answer follows, not only which answer wins.",
          }
        : step,
    ),
  });

  assert.equal(report.ok, false);
  assert.equal(report.checks.find((check) => check.id === "specificity")?.passed, false);
});
