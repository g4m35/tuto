import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

async function importFresh<T>(specifier: string): Promise<T> {
  return import(`${specifier}?t=${Date.now()}-${Math.random()}`) as Promise<T>;
}

test("course-store file fallback keeps courses scoped to the owning user", async () => {
  const previousCwd = process.cwd();
  const tempDir = await mkdtemp(path.join(tmpdir(), "tuto-course-store-"));

  process.chdir(tempDir);

  try {
    const store = await importFresh<typeof import("../lib/course-store")>("../lib/course-store");

    await store.saveCourse({
      id: "course-a",
      clerkId: "user-a",
      title: "Algebra I",
      subject: "Mathematics",
      difficulty: "Beginner",
      description: "Topic course",
      sourceMode: "topic",
      sourceIds: [],
      knowledgeBaseName: null,
      deeptutorSessionId: "session-a",
      deeptutorStatus: "initialized",
      currentLessonIndex: 0,
      currentLessonId: null,
      guidePayload: {
        knowledge_points: [],
        progress: 0,
      },
      backendMode: "stub",
    });

    await store.saveCourse({
      id: "course-a",
      clerkId: "user-b",
      title: "World History",
      subject: "History",
      difficulty: "Intermediate",
      description: "Second user's course",
      sourceMode: "topic",
      sourceIds: [],
      knowledgeBaseName: null,
      deeptutorSessionId: "session-b",
      deeptutorStatus: "initialized",
      currentLessonIndex: 0,
      currentLessonId: null,
      guidePayload: {
        knowledge_points: [],
        progress: 0,
      },
      backendMode: "stub",
    });

    await store.updateCourseProgress({
      clerkId: "user-a",
      courseId: "course-a",
      currentLessonIndex: 2,
      currentLessonId: "lesson-3",
      deeptutorStatus: "in_progress",
    });

    const ownerCourse = await store.getCourseForUser("user-a", "course-a");
    const otherUserCourse = await store.getCourseForUser("user-b", "course-a");
    const ownerCourses = await store.listCoursesForUser("user-a");
    const otherUserCourses = await store.listCoursesForUser("user-b");

    assert.equal(ownerCourse?.id, "course-a");
    assert.equal(ownerCourse?.currentLessonIndex, 2);
    assert.equal(ownerCourse?.currentLessonId, "lesson-3");
    assert.equal(ownerCourse?.deeptutorStatus, "in_progress");
    assert.equal(otherUserCourse?.title, "World History");
    assert.equal(otherUserCourse?.currentLessonIndex, 0);
    assert.equal(ownerCourses.length, 1);
    assert.equal(otherUserCourses.length, 1);
    assert.equal(otherUserCourses[0]?.title, "World History");
    assert.equal(otherUserCourses[0]?.currentLessonIndex, 0);
  } finally {
    process.chdir(previousCwd);
  }
});
