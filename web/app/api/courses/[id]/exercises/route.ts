import { NextResponse } from "next/server";
import { findLesson } from "@/lib/course-data";
import { getCourseForUser, saveExercise, updateCourseProgress } from "@/lib/course-store";
import { recordUsage } from "@/lib/usage";
import { DeepTutorClientError, generateExercise } from "@/lib/deeptutor";
import { withUsageLimit } from "@/lib/withUsageLimit";

export const runtime = "nodejs";

export const POST = withUsageLimit<{ params: Promise<{ id: string }> }>(
  "message",
  async (request, { clerkId, params }) => {
    try {
      const { id } = await params;
      const body = (await request.json().catch(() => ({}))) as {
        lessonId?: string;
        userHistory?: string[];
      };

      if (!body.lessonId) {
        return NextResponse.json({ error: "lessonId is required." }, { status: 400 });
      }

      const course = await getCourseForUser(clerkId, id);
      if (!course) {
        return NextResponse.json({ error: "Course not found." }, { status: 404 });
      }

      const lesson = findLesson(course, body.lessonId);
      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
      }

      const lessonIndex = course.guidePayload.knowledge_points?.findIndex(
        (point) => lesson.title === point.knowledge_title,
      ) ?? 0;

      const generated = await generateExercise(body.lessonId, {
        courseId: course.id,
        courseTitle: course.title,
        lessonTitle: lesson.title,
        lessonSummary: lesson.summary,
        knowledgeBaseName: course.knowledgeBaseName,
        recentPerformance: Array.isArray(body.userHistory) ? body.userHistory : [],
      });

      const storedExercise = await saveExercise({
        courseId: course.id,
        clerkId,
        lessonId: body.lessonId,
        payload: generated.exercise,
        backendMode: generated.backendMode,
      });

      await updateCourseProgress({
        clerkId,
        courseId: course.id,
        currentLessonIndex: Math.max(lessonIndex, course.currentLessonIndex),
        currentLessonId: body.lessonId,
        deeptutorStatus: "learning",
      });

      await recordUsage(clerkId, "message", {
        courseId: course.id,
        lessonId: body.lessonId,
        backendMode: generated.backendMode,
      });

      return NextResponse.json({
        exercise: storedExercise.payload,
        backendMode: storedExercise.backendMode,
      });
    } catch (error) {
      if (error instanceof DeepTutorClientError) {
        return NextResponse.json(
          {
            error: error.message,
            details: error.details,
          },
          { status: error.status ?? 502 },
        );
      }

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Unable to generate exercise.",
        },
        { status: 500 },
      );
    }
  },
);
