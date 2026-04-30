import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCourseLessonQuality } from "../lib/course-quality";
import type { ExerciseData } from "../lib/mock-data";

function buildQualityExercise(overrides: Partial<ExerciseData> = {}): ExerciseData {
  const exercise: ExerciseData = {
    courseId: "course-quality",
    lessonId: "lesson-quality",
    title: "Quality lesson",
    subtitle: "Interactive lesson",
    objective: "Understand the concept through a guided lesson.",
    prompt: "Which option best explains the concept?",
    step: 6,
    stepCount: 6,
    xp: 50,
    correctOptionId: "a",
    hint: "Choose the option that explains the mechanism and the boundary.",
    explanation: "The correct option connects what happens, why it matters, and where it stops applying.",
    checkpointStepId: "lesson-quality-checkpoint",
    options: [
      { id: "a", label: "A", body: "It explains the mechanism and boundary." },
      { id: "b", label: "B", body: "It repeats a memorized phrase." },
    ],
    steps: [
      {
        id: "lesson-quality-hook",
        kind: "hook",
        title: "Start with the puzzle",
        body: "A real lesson starts by creating a question the learner wants to resolve.",
      },
      {
        id: "lesson-quality-concept",
        kind: "concept",
        title: "Build the model",
        body: "The concept step gives the learner a durable mental model before asking for recall.",
      },
      {
        id: "lesson-quality-example",
        kind: "example",
        title: "Work a small example",
        body: "The example step shows how the mental model behaves in a concrete case.",
      },
      {
        id: "lesson-quality-interactive",
        kind: "interactive",
        title: "Compare the moving parts",
        body: "The interactive step asks the learner to reveal and compare important distinctions.",
        interactive: {
          kind: "compare",
          prompt: "Tap each card to reveal its role.",
          items: [
            { id: "mechanism", label: "Mechanism", body: "How the idea works." },
            { id: "trap", label: "Trap", body: "A common mistake." },
          ],
        },
      },
      {
        id: "lesson-quality-practice",
        kind: "practice",
        title: "Try it before the checkpoint",
        body: "The practice step lets the learner predict before choosing from answer options.",
      },
      {
        id: "lesson-quality-checkpoint",
        kind: "checkpoint",
        title: "Checkpoint",
        body: "The checkpoint verifies that the learner can choose the strongest explanation.",
        prompt: "Which option best explains the concept?",
        correctOptionId: "a",
        options: [
          { id: "a", label: "A", body: "It explains the mechanism and boundary." },
          { id: "b", label: "B", body: "It repeats a memorized phrase." },
        ],
      },
    ],
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
  assert.equal(report.checks.find((check) => check.id === "lesson-script")?.passed, false);
  assert.equal(report.checks.find((check) => check.id === "interactive-component")?.passed, false);
});

test("evaluateCourseLessonQuality rejects generic lesson-template copy", () => {
  const exercise = buildQualityExercise();
  const report = evaluateCourseLessonQuality({
    ...exercise,
    steps: exercise.steps?.map((step) =>
      step.kind === "example"
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
