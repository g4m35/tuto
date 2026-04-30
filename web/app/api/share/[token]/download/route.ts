import { NextResponse } from "next/server";
import {
  buildCourseArtifactExport,
  normalizeCourseArtifactExportFormat,
} from "@/lib/course-artifacts";
import { getCourseByShareToken } from "@/lib/course-store";
import { DatabaseConfigurationError } from "@/lib/db";

export const runtime = "nodejs";

function fileResponse(body: BodyInit, contentType: string, fileName: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "public, max-age=60",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const course = await getCourseByShareToken(token);

    if (!course) {
      return NextResponse.json({ error: "Shared artifact not found." }, { status: 404 });
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
