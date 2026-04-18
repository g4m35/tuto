import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { toLessonId } from "@/lib/course-data";
import { getCourseForUser, listCoursesForUser, saveCourse } from "@/lib/course-store";
import { checkLimit, recordUsage } from "@/lib/usage";
import { DeepTutorClientError, generateCourse, ingestDocument } from "@/lib/deeptutor";
import { withUsageLimit } from "@/lib/withUsageLimit";

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

  const courses = await listCoursesForUser(userId);
  return NextResponse.json({ courses });
}

export const POST = withUsageLimit("course_created", async (request, { clerkId }) => {
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

      const uploadLimit = await checkLimit(clerkId, "doc_upload");
      if (!uploadLimit.allowed) {
        return NextResponse.json(
          {
            error: "limit_reached",
            limit: uploadLimit.limit,
            current: uploadLimit.current,
            upgrade_url: "/pricing",
          },
          { status: 429 },
        );
      }

      const ingested = await ingestDocument(file, clerkId);
      sourceIds = [ingested.id];
      knowledgeBaseName = ingested.knowledgeBaseName;
      backendMode = ingested.backendMode;
      description =
        topicPrompt ||
        `Create a course from the uploaded source "${file.name}" and teach it step by step.`;

      await recordUsage(clerkId, "doc_upload", {
        sourceId: ingested.id,
        knowledgeBaseName: ingested.knowledgeBaseName,
        backendMode: ingested.backendMode,
      });
    }

    const generated = await generateCourse(sourceIds, {
      title,
      subject,
      difficulty,
      prompt: description,
      sourceMode: mode,
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
      clerkId,
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

    await recordUsage(clerkId, "course_created", {
      courseId: course.id,
      backendMode: course.backendMode,
      sourceMode: course.sourceMode,
    });

    const persisted = await getCourseForUser(clerkId, course.id);

    return attachStubHeader(
      NextResponse.json({
        course: persisted ?? course,
      }),
      course.backendMode,
    );
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
        error: error instanceof Error ? error.message : "Unable to create course.",
      },
      { status: 500 },
    );
  }
});
