import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  buildCourseArtifactExport,
  normalizeCourseArtifactExportFormat,
} from "@/lib/course-artifacts";
import { getCourseForUser } from "@/lib/course-store";
import { DatabaseConfigurationError } from "@/lib/db";

export const runtime = "nodejs";

function fileResponse(body: BodyInit, contentType: string, fileName: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const course = await getCourseForUser(userId, id);

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const url = new URL(request.url);
    const format = normalizeCourseArtifactExportFormat(url.searchParams.get("format"));
    const artifact = buildCourseArtifactExport(course, format);

    return fileResponse(artifact.body, artifact.contentType, artifact.fileName);
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json(
        { error: "database_not_configured", detail: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to download artifact." },
      { status: 500 },
    );
  }
}
