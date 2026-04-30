import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { disableCourseSharing, enableCourseSharing } from "@/lib/course-store";
import { DatabaseConfigurationError } from "@/lib/db";

export const runtime = "nodejs";

function buildShareUrl(request: Request, token: string) {
  return new URL(`/share/${token}`, request.url).toString();
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
    const course = await enableCourseSharing({ clerkId: userId, courseId: id });

    if (!course || !course.shareToken) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    return NextResponse.json({
      shareEnabled: true,
      shareToken: course.shareToken,
      shareUrl: buildShareUrl(request, course.shareToken),
    });
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json(
        { error: "database_not_configured", detail: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to enable sharing." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const course = await disableCourseSharing({ clerkId: userId, courseId: id });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    return NextResponse.json({ shareEnabled: false });
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json(
        { error: "database_not_configured", detail: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to disable sharing." },
      { status: 500 },
    );
  }
}
