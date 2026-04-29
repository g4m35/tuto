import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getLessonIdByIndex,
  getLessonIndexById,
} from "@/lib/course-data";
import {
  getCourseForUser,
  getLatestExerciseForLesson,
  saveCourseAttempt,
  updateCourseProgress,
} from "@/lib/course-store";
import { DatabaseConfigurationError } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      lessonId?: string;
      selectedOptionId?: string;
    };

    if (!body.lessonId || !body.selectedOptionId) {
      return NextResponse.json(
        { error: "lessonId and selectedOptionId are required." },
        { status: 400 },
      );
    }

    const course = await getCourseForUser(userId, id);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const exercise = await getLatestExerciseForLesson({
      clerkId: userId,
      courseId: id,
      lessonId: body.lessonId,
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
    }

    const selectedOption = exercise.payload.options.find(
      (option) => option.id === body.selectedOptionId,
    );

    if (!selectedOption) {
      return NextResponse.json({ error: "Selected option is not part of this exercise." }, { status: 400 });
    }

    const correctOption = exercise.payload.correctOptionId
      ? exercise.payload.options.find((option) => option.id === exercise.payload.correctOptionId)
      : null;
    const isCorrect = correctOption ? selectedOption.id === correctOption.id : true;
    const lessonIndex = getLessonIndexById(course, body.lessonId);
    const nextLessonIndex = lessonIndex >= 0 ? lessonIndex + 1 : course.currentLessonIndex;
    const nextLessonId = getLessonIdByIndex(course, nextLessonIndex);

    if (isCorrect) {
      await updateCourseProgress({
        clerkId: userId,
        courseId: course.id,
        currentLessonIndex: Math.max(nextLessonIndex, course.currentLessonIndex),
        currentLessonId: nextLessonId,
        deeptutorStatus: nextLessonId ? "learning" : "complete",
      });
    }

    await saveCourseAttempt({
      clerkId: userId,
      courseId: course.id,
      workflowKind: "lesson",
      lessonId: body.lessonId,
      unitId: null,
      selectedOptionId: selectedOption.id,
      isCorrect,
      metadata: {
        correctOptionId: correctOption?.id ?? selectedOption.id,
      },
    });

    return NextResponse.json({
      isCorrect,
      selectedOptionId: selectedOption.id,
      correctOptionId: correctOption?.id ?? selectedOption.id,
      correctOptionBody: correctOption?.body ?? selectedOption.body,
      explanation:
        exercise.payload.explanation ??
        exercise.payload.hint ??
        "Review the explanation, then continue when the answer makes sense.",
      canContinue: isCorrect,
      nextLessonId,
      courseComplete: isCorrect && !nextLessonId,
    });
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json(
        { error: "database_not_configured", detail: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to check answer." },
      { status: 500 },
    );
  }
}
