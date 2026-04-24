import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { toLessonId } from "@/lib/course-data";
import { getCourseForUser, listCoursesForUser, saveCourse } from "@/lib/course-store";
import { DatabaseConfigurationError } from "@/lib/db";
import {
  commitUsageReservation,
  recordUsage,
  releaseUsageReservation,
  reserveUsage,
  type UsageReservation,
} from "@/lib/usage";
import { DeepTutorClientError, generateCourse, ingestDocument } from "@/lib/deeptutor";

export const runtime = "nodejs";

function attachStubHeader(
  response: NextResponse,
  backendMode: "live" | "stub",
) {
  if (backendMode === "stub") {
    response.headers.set("X-Tuto-Stub", "true");
  }

  return response;
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const courses = await listCoursesForUser(userId);
    return NextResponse.json({ courses });
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json(
        { error: "database_not_configured", detail: error.message },
        { status: 503 },
      );
    }

    throw error;
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let uploadReservation: UsageReservation | null = null;

  try {
    const formData = await request.formData();

    const mode = formData.get("mode") === "upload" ? "upload" : "topic";
    const title = String(formData.get("title") || "").trim();
    const subject = String(formData.get("subject") || "Mathematics").trim();
    const difficulty = String(formData.get("difficulty") || "Intermediate").trim();
    const topicPrompt = String(formData.get("topicPrompt") || "").trim();
    const file = formData.get("file");

    if (!title) {
      return NextResponse.json({ error: "Course title is required." }, { status: 400 });
    }

    if (mode === "topic" && !topicPrompt) {
      return NextResponse.json({ error: "Topic prompt is required." }, { status: 400 });
    }

    let sourceIds: string[] = [];
    let knowledgeBaseName: string | null = null;
    let backendMode: "live" | "stub" = "live";
    let description = topicPrompt || `Build a guided course for ${title}.`;

    if (mode === "upload") {
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json(
          { error: "Upload mode requires a source document." },
          { status: 400 },
        );
      }

      const uploadLimit = await reserveUsage(userId, "doc_upload", {
        metadata: {
          fileName: file.name,
          fileSize: file.size,
        },
      });
      if (!uploadLimit.ok) {
        return NextResponse.json(
          {
            error: "limit_reached",
            tier: uploadLimit.usage.tier,
            limit: uploadLimit.usage.limit,
            current: uploadLimit.usage.current,
            upgrade_url: "/pricing",
          },
          { status: 429 },
        );
      }

      uploadReservation = uploadLimit.reservation;

      const ingested = await ingestDocument(file, userId);
      sourceIds = [ingested.id];
      knowledgeBaseName = ingested.knowledgeBaseName;
      backendMode = ingested.backendMode;
      description =
        topicPrompt ||
        `Create a course from the uploaded source "${file.name}" and teach it step by step.`;

      uploadReservation.metadata = {
        sourceId: ingested.id,
        knowledgeBaseName: ingested.knowledgeBaseName,
        backendMode: ingested.backendMode,
      };
    }

    const generated = await generateCourse(sourceIds, {
      title,
      subject,
      difficulty,
      prompt: description,
      sourceMode: mode,
      knowledgeBaseName,
    });

    const courseId = randomUUID();
    const knowledgePoints = generated.knowledgePoints;
    const currentLessonIndex = Math.max(
      0,
      Math.min(generated.currentLessonIndex, Math.max(knowledgePoints.length - 1, 0)),
    );
    const currentLessonId = knowledgePoints.length
      ? toLessonId(courseId, currentLessonIndex, knowledgePoints[currentLessonIndex]?.knowledge_title || "lesson")
      : null;

    const course = await saveCourse({
      id: courseId,
      clerkId: userId,
      title,
      subject,
      difficulty,
      description,
      sourceMode: mode,
      sourceIds,
      knowledgeBaseName,
      deeptutorSessionId: generated.sessionId,
      deeptutorStatus: generated.progress > 0 ? "learning" : "initialized",
      currentLessonIndex,
      currentLessonId,
      guidePayload: {
        ...(generated.raw as Record<string, unknown>),
        knowledge_points: knowledgePoints,
        progress: generated.progress,
      },
      backendMode: generated.backendMode === "stub" ? "stub" : backendMode,
    });

    if (uploadReservation) {
      await commitUsageReservation(uploadReservation, {
        ...uploadReservation.metadata,
        courseId: course.id,
      });
      uploadReservation = null;
    }

    await recordUsage(userId, "course_created", {
      courseId: course.id,
      backendMode: course.backendMode,
      sourceMode: course.sourceMode,
    });

    const persisted = await getCourseForUser(userId, course.id);

    return attachStubHeader(
      NextResponse.json({
        course: persisted ?? course,
      }),
      course.backendMode,
    );
  } catch (error) {
    await releaseUsageReservation(uploadReservation);

    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json(
        {
          error: "database_not_configured",
          detail: error.message,
        },
        { status: 503 },
      );
    }

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
        error: error instanceof Error ? error.message : "Unable to create course.",
      },
      { status: 500 },
    );
  }
}
