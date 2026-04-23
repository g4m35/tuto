import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  assertDatabaseConfigured,
  canUseEphemeralDatabaseFallback,
  isDatabaseConfigured,
  query,
} from "@/lib/db";
import type { StoredCourse, StoredExercise } from "@/lib/course-data";

interface CourseRow {
  id: string;
  clerk_id: string;
  title: string;
  subject: string;
  difficulty: string;
  description: string;
  source_mode: "topic" | "upload";
  source_ids: string[] | string;
  knowledge_base_name: string | null;
  deeptutor_session_id: string;
  deeptutor_status: string;
  current_lesson_index: number;
  current_lesson_id: string | null;
  guide_payload: StoredCourse["guidePayload"] | string;
  backend_mode: "live" | "stub";
  created_at: Date | string;
  updated_at: Date | string;
}

interface ExerciseRow {
  id: string;
  course_id: string;
  clerk_id: string;
  lesson_id: string;
  exercise_payload: StoredExercise["payload"] | string;
  backend_mode: "live" | "stub";
  created_at: Date | string;
}

interface FileStoreShape {
  courses: StoredCourse[];
  exercises: StoredExercise[];
}

const FILE_STORE_PATH = path.join(process.cwd(), ".local-data", "course-store.json");

function assertCourseStoreConfigured() {
  assertDatabaseConfigured("Course storage");
}

function toIsoString(value: Date | string) {
  return typeof value === "string" ? value : value.toISOString();
}

function normalizeJson<T>(value: T | string): T {
  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }

  return value;
}

function mapCourseRow(row: CourseRow): StoredCourse {
  return {
    id: row.id,
    clerkId: row.clerk_id,
    title: row.title,
    subject: row.subject,
    difficulty: row.difficulty,
    description: row.description,
    sourceMode: row.source_mode,
    sourceIds: Array.isArray(row.source_ids)
      ? row.source_ids
      : normalizeJson<string[]>(row.source_ids),
    knowledgeBaseName: row.knowledge_base_name,
    deeptutorSessionId: row.deeptutor_session_id,
    deeptutorStatus: row.deeptutor_status,
    currentLessonIndex: row.current_lesson_index,
    currentLessonId: row.current_lesson_id,
    guidePayload: normalizeJson<StoredCourse["guidePayload"]>(row.guide_payload),
    backendMode: row.backend_mode,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapExerciseRow(row: ExerciseRow): StoredExercise {
  return {
    id: row.id,
    courseId: row.course_id,
    clerkId: row.clerk_id,
    lessonId: row.lesson_id,
    payload: normalizeJson<StoredExercise["payload"]>(row.exercise_payload),
    backendMode: row.backend_mode,
    createdAt: toIsoString(row.created_at),
  };
}

async function readFileStore(): Promise<FileStoreShape> {
  try {
    const raw = await readFile(FILE_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as FileStoreShape;
    return {
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
    };
  } catch {
    return { courses: [], exercises: [] };
  }
}

async function writeFileStore(nextStore: FileStoreShape) {
  await mkdir(path.dirname(FILE_STORE_PATH), { recursive: true });
  await writeFile(FILE_STORE_PATH, JSON.stringify(nextStore, null, 2));
}

export async function listCoursesForUser(clerkId: string): Promise<StoredCourse[]> {
  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    return store.courses
      .filter((course) => course.clerkId === clerkId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  const result = await query<CourseRow>(
    `
      select *
      from courses
      where clerk_id = $1
      order by updated_at desc
    `,
    [clerkId],
  );

  return result.rows.map(mapCourseRow);
}

export async function getCourseForUser(
  clerkId: string,
  courseId: string,
): Promise<StoredCourse | null> {
  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    return store.courses.find((course) => course.clerkId === clerkId && course.id === courseId) ?? null;
  }

  const result = await query<CourseRow>(
    `
      select *
      from courses
      where clerk_id = $1
        and id = $2
      limit 1
    `,
    [clerkId, courseId],
  );

  const row = result.rows[0];
  return row ? mapCourseRow(row) : null;
}

export async function saveCourse(course: Omit<StoredCourse, "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const stored: StoredCourse = {
    ...course,
    createdAt: now,
    updatedAt: now,
  };

  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    store.courses = [
      stored,
      ...store.courses.filter((item) => !(item.clerkId === stored.clerkId && item.id === stored.id)),
    ];
    await writeFileStore(store);
    return stored;
  }

  const result = await query<CourseRow>(
    `
      insert into courses (
        id,
        clerk_id,
        title,
        subject,
        difficulty,
        description,
        source_mode,
        source_ids,
        knowledge_base_name,
        deeptutor_session_id,
        deeptutor_status,
        current_lesson_index,
        current_lesson_id,
        guide_payload,
        backend_mode
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14::jsonb, $15
      )
      returning *
    `,
    [
      stored.id,
      stored.clerkId,
      stored.title,
      stored.subject,
      stored.difficulty,
      stored.description,
      stored.sourceMode,
      JSON.stringify(stored.sourceIds),
      stored.knowledgeBaseName,
      stored.deeptutorSessionId,
      stored.deeptutorStatus,
      stored.currentLessonIndex,
      stored.currentLessonId,
      JSON.stringify(stored.guidePayload),
      stored.backendMode,
    ],
  );

  return mapCourseRow(result.rows[0]);
}

export async function updateCourseProgress(input: {
  clerkId: string;
  courseId: string;
  currentLessonIndex: number;
  currentLessonId: string | null;
  deeptutorStatus?: string;
}) {
  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    store.courses = store.courses.map((course) =>
      course.clerkId === input.clerkId && course.id === input.courseId
        ? {
            ...course,
            currentLessonIndex: input.currentLessonIndex,
            currentLessonId: input.currentLessonId,
            deeptutorStatus: input.deeptutorStatus ?? course.deeptutorStatus,
            updatedAt: new Date().toISOString(),
          }
        : course,
    );
    await writeFileStore(store);
    return;
  }

  await query(
    `
      update courses
      set current_lesson_index = $3,
          current_lesson_id = $4,
          deeptutor_status = coalesce($5, deeptutor_status),
          updated_at = now()
      where clerk_id = $1
        and id = $2
    `,
    [
      input.clerkId,
      input.courseId,
      input.currentLessonIndex,
      input.currentLessonId,
      input.deeptutorStatus ?? null,
    ],
  );
}

export async function saveExercise(
  exercise: Omit<StoredExercise, "id" | "createdAt">,
): Promise<StoredExercise> {
  const stored: StoredExercise = {
    ...exercise,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    store.exercises = [
      stored,
      ...store.exercises.filter(
        (item) =>
          !(
            item.clerkId === stored.clerkId &&
            item.courseId === stored.courseId &&
            item.lessonId === stored.lessonId
          ),
      ),
    ];
    await writeFileStore(store);
    return stored;
  }

  const result = await query<ExerciseRow>(
    `
      insert into course_exercises (
        id,
        course_id,
        clerk_id,
        lesson_id,
        exercise_payload,
        backend_mode
      )
      values ($1, $2, $3, $4, $5::jsonb, $6)
      returning *
    `,
    [
      stored.id,
      stored.courseId,
      stored.clerkId,
      stored.lessonId,
      JSON.stringify(stored.payload),
      stored.backendMode,
    ],
  );

  return mapExerciseRow(result.rows[0]);
}

export async function getLatestExerciseForLesson(input: {
  clerkId: string;
  courseId: string;
  lessonId: string;
}): Promise<StoredExercise | null> {
  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    return (
      store.exercises.find(
        (item) =>
          item.clerkId === input.clerkId &&
          item.courseId === input.courseId &&
          item.lessonId === input.lessonId,
      ) ?? null
    );
  }

  const result = await query<ExerciseRow>(
    `
      select *
      from course_exercises
      where clerk_id = $1
        and course_id = $2
        and lesson_id = $3
      order by created_at desc
      limit 1
    `,
    [input.clerkId, input.courseId, input.lessonId],
  );

  const row = result.rows[0];
  return row ? mapExerciseRow(row) : null;
}
