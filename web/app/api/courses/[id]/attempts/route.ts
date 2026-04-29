import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCourseForUser, saveCourseAttempt } from "@/lib/course-store";
import { DatabaseConfigurationError } from "@/lib/db";
import type { CourseWorkflowKind } from "@/lib/mock-data";

export const runtime = "nodejs";

function isWorkflowKind(value: unknown): value is CourseWorkflowKind {
  return value === "lesson" || value === "review" || value === "project";
}

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
      workflowKind?: unknown;
      lessonId?: string | null;
      unitId?: string | null;
      selectedOptionId?: string | null;
      isCorrect?: boolean;
      metadata?: Record<string, unknown>;
    };

    if (!isWorkflowKind(body.workflowKind)) {
      return NextResponse.json({ error: "workflowKind is required." }, { status: 400 });
    }

    const course = await getCourseForUser(userId, id);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const attempt = await saveCourseAttempt({
      clerkId: userId,
      courseId: course.id,
      workflowKind: body.workflowKind,
      lessonId: body.lessonId || null,
      unitId: body.unitId || null,
      selectedOptionId: body.selectedOptionId || null,
      isCorrect: body.isCorrect === true,
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    });

    return NextResponse.json({ attempt });
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json(
        { error: "database_not_configured", detail: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record attempt." },
      { status: 500 },
    );
  }
}
