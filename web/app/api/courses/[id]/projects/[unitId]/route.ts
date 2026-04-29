import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getCourseForUser,
  saveCourseAttempt,
  saveProjectSubmission,
} from "@/lib/course-store";
import { DatabaseConfigurationError } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; unitId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id, unitId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      response?: string;
      checklist?: string[];
      confidence?: number;
      status?: "submitted" | "complete";
    };

    const course = await getCourseForUser(userId, id);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const response = String(body.response || "").trim();
    if (!response) {
      return NextResponse.json({ error: "Project response is required." }, { status: 400 });
    }

    const confidence = Math.max(0, Math.min(100, Number(body.confidence ?? 50)));
    const checklist = Array.isArray(body.checklist) ? body.checklist.map(String) : [];
    const status = body.status === "complete" ? "complete" : "submitted";
    const submission = await saveProjectSubmission({
      clerkId: userId,
      courseId: course.id,
      unitId,
      response,
      checklist,
      confidence,
      status,
    });

    await saveCourseAttempt({
      clerkId: userId,
      courseId: course.id,
      workflowKind: "project",
      lessonId: null,
      unitId,
      selectedOptionId: null,
      isCorrect: status === "complete",
      metadata: {
        confidence,
        checklistCount: checklist.length,
        responseLength: response.length,
      },
    });

    return NextResponse.json({ submission });
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json(
        { error: "database_not_configured", detail: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save project." },
      { status: 500 },
    );
  }
}
