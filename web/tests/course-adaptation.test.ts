import test from "node:test";
import assert from "node:assert/strict";
import { buildRecentPerformanceSummary } from "../lib/course-adaptation";
import type { StoredCourseAttempt } from "../lib/course-data";

function attempt(overrides: Partial<StoredCourseAttempt> = {}): StoredCourseAttempt {
  return {
    id: overrides.id ?? "attempt",
    courseId: overrides.courseId ?? "course-adaptive",
    clerkId: overrides.clerkId ?? "user-adaptive",
    workflowKind: overrides.workflowKind ?? "lesson",
    lessonId: overrides.lessonId ?? "lesson-1",
    unitId: overrides.unitId ?? null,
    selectedOptionId: overrides.selectedOptionId ?? "B",
    isCorrect: overrides.isCorrect ?? false,
    metadata: overrides.metadata ?? { correctOptionId: "C" },
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

test("buildRecentPerformanceSummary starts new learners with a diagnostic cue", () => {
  assert.deepEqual(buildRecentPerformanceSummary([], "lesson-1"), [
    "No prior lesson attempts are recorded. Start with a diagnostic concept check, then adapt the example difficulty to the learner's first response.",
  ]);
});

test("buildRecentPerformanceSummary asks DeepTutor to reteach after repeated misses", () => {
  const summary = buildRecentPerformanceSummary(
    [
      attempt({ id: "miss-2", lessonId: "lesson-1", selectedOptionId: "A", isCorrect: false }),
      attempt({ id: "miss-1", lessonId: "lesson-1", selectedOptionId: "B", isCorrect: false }),
      attempt({ id: "old-pass", lessonId: "lesson-0", selectedOptionId: "C", isCorrect: true }),
    ],
    "lesson-1",
  );

  assert.equal(summary.some((line) => line.includes("missed 2 checkpoint attempts")), true);
  assert.equal(summary.some((line) => line.includes("reteach the prerequisite")), true);
  assert.equal(summary.some((line) => line.includes("Recent lesson accuracy: 1/3 correct")), true);
});

test("buildRecentPerformanceSummary asks for stretch work after a clean current pass", () => {
  const summary = buildRecentPerformanceSummary(
    [
      attempt({ id: "pass-2", lessonId: "lesson-2", selectedOptionId: "C", isCorrect: true }),
      attempt({ id: "pass-1", lessonId: "lesson-1", selectedOptionId: "C", isCorrect: true }),
    ],
    "lesson-2",
  );

  assert.equal(summary.some((line) => line.includes("answered this lesson correctly")), true);
  assert.equal(summary.some((line) => line.includes("slightly harder transfer")), true);
});
