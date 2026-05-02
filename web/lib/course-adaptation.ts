import type { StoredCourseAttempt } from "@/lib/course-data";

function summarizeAccuracy(attempts: StoredCourseAttempt[]) {
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  return `Recent lesson accuracy: ${correct}/${attempts.length} correct.`;
}

function describeMistakes(attempts: StoredCourseAttempt[]) {
  const misses = attempts
    .filter((attempt) => !attempt.isCorrect)
    .slice(0, 3)
    .map((attempt) => {
      const correctOptionId =
        typeof attempt.metadata?.correctOptionId === "string"
          ? attempt.metadata.correctOptionId
          : null;
      return correctOptionId
        ? `selected ${attempt.selectedOptionId ?? "none"} when ${correctOptionId} was correct`
        : `selected ${attempt.selectedOptionId ?? "none"}`;
    });

  return misses.length ? `Recent misses: ${misses.join("; ")}.` : null;
}

export function buildRecentPerformanceSummary(
  attempts: StoredCourseAttempt[],
  lessonId: string,
): string[] {
  const lessonAttempts = attempts.filter(
    (attempt) => attempt.workflowKind === "lesson" && attempt.lessonId === lessonId,
  );
  const recentLessonAttempts = attempts
    .filter((attempt) => attempt.workflowKind === "lesson")
    .slice(0, 6);

  if (!recentLessonAttempts.length) {
    return [
      "No prior lesson attempts are recorded. Start with a diagnostic concept check, then adapt the example difficulty to the learner's first response.",
    ];
  }

  const currentMisses = lessonAttempts.filter((attempt) => !attempt.isCorrect).length;
  const currentPasses = lessonAttempts.filter((attempt) => attempt.isCorrect).length;
  const summary = [summarizeAccuracy(recentLessonAttempts)];

  if (currentMisses > 0 && currentPasses === 0) {
    summary.push(
      `The learner has missed ${currentMisses} checkpoint attempts on this lesson; reteach the prerequisite idea with a simpler worked example, target the misconception, and ask a nearby but not identical question.`,
    );
  } else if (currentPasses > 0 && currentMisses === 0) {
    summary.push(
      "The learner answered this lesson correctly; use a slightly harder transfer example before moving into the next idea.",
    );
  } else if (currentMisses > 0 && currentPasses > 0) {
    summary.push(
      "The learner recovered after an earlier miss; reinforce the corrected reasoning and ask for an explanation, not only another answer.",
    );
  }

  const mistakes = describeMistakes(recentLessonAttempts);
  if (mistakes) {
    summary.push(mistakes);
  }

  return summary;
}
