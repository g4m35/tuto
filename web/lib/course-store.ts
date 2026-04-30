import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  assertDatabaseConfigured,
  canUseEphemeralDatabaseFallback,
  isDatabaseConfigured,
  query,
} from "@/lib/db";
import type {
  StoredCourse,
  StoredCourseAttempt,
  StoredExercise,
  StoredProjectSubmission,
} from "@/lib/course-data";
import { normalizeCourseArtifactKind } from "@/lib/course-artifacts";

interface CourseRow {
  id: string;
  clerk_id: string;
  title: string;
  subject: string;
  difficulty: string;
  description: string;
  artifact_kind?: StoredCourse["artifactKind"] | null;
  source_mode: "topic" | "upload";
  source_ids: string[];
  knowledge_base_name: string | null;
  deeptutor_session_id: string;
  deeptutor_status: string;
  current_lesson_index: number;
  current_lesson_id: string | null;
  guide_payload: StoredCourse["guidePayload"];
  backend_mode: "live" | "stub";
  share_token?: string | null;
  share_enabled?: boolean | null;
  shared_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ExerciseRow {
  id: string;
  course_id: string;
  clerk_id: string;
  lesson_id: string;
  exercise_payload: StoredExercise["payload"];
  backend_mode: "live" | "stub";
  created_at: Date | string;
}

interface AttemptRow {
  id: string;
  course_id: string;
  clerk_id: string;
  workflow_kind: StoredCourseAttempt["workflowKind"];
  lesson_id: string | null;
  unit_id: string | null;
  selected_option_id: string | null;
  is_correct: boolean;
  metadata: StoredCourseAttempt["metadata"];
  created_at: Date | string;
}

interface ProjectSubmissionRow {
  id: string;
  course_id: string;
  clerk_id: string;
  unit_id: string;
  response: string;
  checklist: string[];
  confidence: number;
  status: StoredProjectSubmission["status"];
  created_at: Date | string;
  updated_at: Date | string;
}

interface FileStoreShape {
  courses: StoredCourse[];
  exercises: StoredExercise[];
  attempts: StoredCourseAttempt[];
  projectSubmissions: StoredProjectSubmission[];
}

const FILE_STORE_PATH = process.env.TUTO_COURSE_STORE_PATH
  ? path.resolve(process.env.TUTO_COURSE_STORE_PATH)
  : path.join(process.cwd(), ".local-data", "course-store.json");

function assertCourseStoreConfigured() {
  assertDatabaseConfigured("Course storage");
}

function toIsoString(value: Date | string) {
  return typeof value === "string" ? value : value.toISOString();
}

function normalizeStoredCourse(course: StoredCourse): StoredCourse {
  return {
    ...course,
    artifactKind: normalizeCourseArtifactKind(course.artifactKind),
    shareToken: course.shareToken ?? null,
    shareEnabled: course.shareEnabled === true,
    sharedAt: course.sharedAt ?? null,
  };
}

function mapCourseRow(row: CourseRow): StoredCourse {
  return {
    id: row.id,
    clerkId: row.clerk_id,
    title: row.title,
    subject: row.subject,
    difficulty: row.difficulty,
    description: row.description,
    artifactKind: normalizeCourseArtifactKind(row.artifact_kind),
    sourceMode: row.source_mode,
    sourceIds: row.source_ids,
    knowledgeBaseName: row.knowledge_base_name,
    deeptutorSessionId: row.deeptutor_session_id,
    deeptutorStatus: row.deeptutor_status,
    currentLessonIndex: row.current_lesson_index,
    currentLessonId: row.current_lesson_id,
    guidePayload: row.guide_payload,
    backendMode: row.backend_mode,
    shareToken: row.share_token ?? null,
    shareEnabled: row.share_enabled === true,
    sharedAt: row.shared_at ? toIsoString(row.shared_at) : null,
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
    payload: row.exercise_payload,
    backendMode: row.backend_mode,
    createdAt: toIsoString(row.created_at),
  };
}

function mapAttemptRow(row: AttemptRow): StoredCourseAttempt {
  return {
    id: row.id,
    courseId: row.course_id,
    clerkId: row.clerk_id,
    workflowKind: row.workflow_kind,
    lessonId: row.lesson_id,
    unitId: row.unit_id,
    selectedOptionId: row.selected_option_id,
    isCorrect: row.is_correct,
    metadata: row.metadata ?? {},
    createdAt: toIsoString(row.created_at),
  };
}

function mapProjectSubmissionRow(row: ProjectSubmissionRow): StoredProjectSubmission {
  return {
    id: row.id,
    courseId: row.course_id,
    clerkId: row.clerk_id,
    unitId: row.unit_id,
    response: row.response,
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    confidence: row.confidence,
    status: row.status,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

async function readFileStore(): Promise<FileStoreShape> {
  try {
    const raw = await readFile(FILE_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as FileStoreShape;
    return {
      courses: Array.isArray(parsed.courses) ? parsed.courses.map(normalizeStoredCourse) : [],
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      projectSubmissions: Array.isArray(parsed.projectSubmissions)
        ? parsed.projectSubmissions
        : [],
    };
  } catch {
    return { courses: [], exercises: [], attempts: [], projectSubmissions: [] };
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
    artifactKind: normalizeCourseArtifactKind(course.artifactKind),
    shareToken: course.shareToken ?? null,
    shareEnabled: course.shareEnabled === true,
    sharedAt: course.sharedAt ?? null,
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
        artifact_kind,
        source_mode,
        source_ids,
        knowledge_base_name,
        deeptutor_session_id,
        deeptutor_status,
        current_lesson_index,
        current_lesson_id,
        guide_payload,
        backend_mode,
        share_token,
        share_enabled,
        shared_at
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14, $15::jsonb, $16, $17, $18, $19
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
      stored.artifactKind,
      stored.sourceMode,
      JSON.stringify(stored.sourceIds),
      stored.knowledgeBaseName,
      stored.deeptutorSessionId,
      stored.deeptutorStatus,
      stored.currentLessonIndex,
      stored.currentLessonId,
      JSON.stringify(stored.guidePayload),
      stored.backendMode,
      stored.shareToken,
      stored.shareEnabled,
      stored.sharedAt,
    ],
  );

  return mapCourseRow(result.rows[0]);
}

export async function enableCourseSharing(input: {
  clerkId: string;
  courseId: string;
}): Promise<StoredCourse | null> {
  const now = new Date().toISOString();
  const token = randomUUID();

  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    let updated: StoredCourse | null = null;
    store.courses = store.courses.map((course) => {
      if (course.clerkId !== input.clerkId || course.id !== input.courseId) {
        return course;
      }

      updated = {
        ...course,
        artifactKind: normalizeCourseArtifactKind(course.artifactKind),
        shareToken: course.shareToken || token,
        shareEnabled: true,
        sharedAt: course.sharedAt || now,
        updatedAt: now,
      };
      return updated;
    });

    await writeFileStore(store);
    return updated;
  }

  const result = await query<CourseRow>(
    `
      update courses
      set share_token = coalesce(share_token, $3),
          share_enabled = true,
          shared_at = coalesce(shared_at, $4::timestamptz),
          updated_at = now()
      where clerk_id = $1
        and id = $2
      returning *
    `,
    [input.clerkId, input.courseId, token, now],
  );

  const row = result.rows[0];
  return row ? mapCourseRow(row) : null;
}

export async function disableCourseSharing(input: {
  clerkId: string;
  courseId: string;
}): Promise<StoredCourse | null> {
  const now = new Date().toISOString();

  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    let updated: StoredCourse | null = null;
    store.courses = store.courses.map((course) => {
      if (course.clerkId !== input.clerkId || course.id !== input.courseId) {
        return course;
      }

      updated = {
        ...course,
        artifactKind: normalizeCourseArtifactKind(course.artifactKind),
        shareEnabled: false,
        updatedAt: now,
      };
      return updated;
    });

    await writeFileStore(store);
    return updated;
  }

  const result = await query<CourseRow>(
    `
      update courses
      set share_enabled = false,
          updated_at = now()
      where clerk_id = $1
        and id = $2
      returning *
    `,
    [input.clerkId, input.courseId],
  );

  const row = result.rows[0];
  return row ? mapCourseRow(row) : null;
}

export async function getCourseByShareToken(token: string): Promise<StoredCourse | null> {
  if (!token.trim()) {
    return null;
  }

  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    const course =
      store.courses.find((item) => item.shareEnabled === true && item.shareToken === token) ??
      null;
    return course
      ? {
          ...course,
          artifactKind: normalizeCourseArtifactKind(course.artifactKind),
          shareToken: course.shareToken ?? null,
          shareEnabled: course.shareEnabled === true,
          sharedAt: course.sharedAt ?? null,
        }
      : null;
  }

  const result = await query<CourseRow>(
    `
      select *
      from courses
      where share_enabled = true
        and share_token = $1
      limit 1
    `,
    [token],
  );

  const row = result.rows[0];
  return row ? mapCourseRow(row) : null;
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

export async function saveCourseAttempt(
  attempt: Omit<StoredCourseAttempt, "id" | "createdAt">,
): Promise<StoredCourseAttempt> {
  const stored: StoredCourseAttempt = {
    ...attempt,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    store.attempts = [stored, ...store.attempts];
    await writeFileStore(store);
    return stored;
  }

  const result = await query<AttemptRow>(
    `
      insert into course_attempts (
        id,
        course_id,
        clerk_id,
        workflow_kind,
        lesson_id,
        unit_id,
        selected_option_id,
        is_correct,
        metadata
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      returning *
    `,
    [
      stored.id,
      stored.courseId,
      stored.clerkId,
      stored.workflowKind,
      stored.lessonId,
      stored.unitId,
      stored.selectedOptionId,
      stored.isCorrect,
      JSON.stringify(stored.metadata ?? {}),
    ],
  );

  return mapAttemptRow(result.rows[0]);
}

export async function listCourseAttempts(input: {
  clerkId: string;
  courseId: string;
  workflowKind?: StoredCourseAttempt["workflowKind"];
}): Promise<StoredCourseAttempt[]> {
  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    return store.attempts
      .filter(
        (attempt) =>
          attempt.clerkId === input.clerkId &&
          attempt.courseId === input.courseId &&
          (!input.workflowKind || attempt.workflowKind === input.workflowKind),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const params: unknown[] = [input.clerkId, input.courseId];
  const workflowFilter = input.workflowKind ? "and workflow_kind = $3" : "";
  if (input.workflowKind) params.push(input.workflowKind);

  const result = await query<AttemptRow>(
    `
      select *
      from course_attempts
      where clerk_id = $1
        and course_id = $2
        ${workflowFilter}
      order by created_at desc
    `,
    params,
  );

  return result.rows.map(mapAttemptRow);
}

export async function saveProjectSubmission(
  submission: Omit<StoredProjectSubmission, "id" | "createdAt" | "updatedAt">,
): Promise<StoredProjectSubmission> {
  const now = new Date().toISOString();
  const stored: StoredProjectSubmission = {
    ...submission,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    store.projectSubmissions = [
      stored,
      ...store.projectSubmissions.filter(
        (item) =>
          !(
            item.clerkId === stored.clerkId &&
            item.courseId === stored.courseId &&
            item.unitId === stored.unitId
          ),
      ),
    ];
    await writeFileStore(store);
    return stored;
  }

  const result = await query<ProjectSubmissionRow>(
    `
      insert into course_project_submissions (
        id,
        course_id,
        clerk_id,
        unit_id,
        response,
        checklist,
        confidence,
        status
      )
      values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
      on conflict (clerk_id, course_id, unit_id)
      do update set
        response = excluded.response,
        checklist = excluded.checklist,
        confidence = excluded.confidence,
        status = excluded.status,
        updated_at = now()
      returning *
    `,
    [
      stored.id,
      stored.courseId,
      stored.clerkId,
      stored.unitId,
      stored.response,
      JSON.stringify(stored.checklist),
      stored.confidence,
      stored.status,
    ],
  );

  return mapProjectSubmissionRow(result.rows[0]);
}

export async function getProjectSubmission(input: {
  clerkId: string;
  courseId: string;
  unitId: string;
}): Promise<StoredProjectSubmission | null> {
  if (!isDatabaseConfigured()) {
    if (!canUseEphemeralDatabaseFallback()) {
      assertCourseStoreConfigured();
    }

    const store = await readFileStore();
    return (
      store.projectSubmissions.find(
        (item) =>
          item.clerkId === input.clerkId &&
          item.courseId === input.courseId &&
          item.unitId === input.unitId,
      ) ?? null
    );
  }

  const result = await query<ProjectSubmissionRow>(
    `
      select *
      from course_project_submissions
      where clerk_id = $1
        and course_id = $2
        and unit_id = $3
      limit 1
    `,
    [input.clerkId, input.courseId, input.unitId],
  );

  const row = result.rows[0];
  return row ? mapProjectSubmissionRow(row) : null;
}
