import { auth } from "@clerk/nextjs/server";
import { CourseProjectClient } from "@/components/courses/CourseProjectClient";
import { toCourseDetailData } from "@/lib/course-data";
import { getCourseForUser, getProjectSubmission } from "@/lib/course-store";
import type { UnitProjectData } from "@/lib/mock-data";

export default async function CourseProjectPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const { id, unitId } = await params;
  const courseRecord = await getCourseForUser(userId, id);

  if (!courseRecord) {
    return (
      <div className="editorial-card px-8 py-8">
        <p className="eyebrow">Project unavailable</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-[var(--text)]">
          This course could not be found.
        </h1>
      </div>
    );
  }

  const course = toCourseDetailData(courseRecord);
  const unit = course.learningPath.find((level) => level.id === unitId);

  if (!unit) {
    return (
      <div className="editorial-card px-8 py-8">
        <p className="eyebrow">Project unavailable</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-[var(--text)]">
          This unit could not be found.
        </h1>
      </div>
    );
  }

  const submission = await getProjectSubmission({
    clerkId: userId,
    courseId: course.id,
    unitId,
  });
  const lessonTitles = unit.lessons.map((lesson) => lesson.title).join(", ");
  const project: UnitProjectData = {
    unitId,
    title: unit.projectTitle || `Apply ${unit.title}`,
    prompt: `Use ${unit.title} to solve or explain a realistic scenario from this course. Your response should connect these lessons: ${lessonTitles}.`,
    rubric: [
      "Names the situation and the decision or explanation needed.",
      "Uses at least two unit concepts instead of a memorized phrase.",
      "Shows the reasoning chain step by step.",
      "Names one limitation, edge case, or uncertainty.",
    ],
    status: submission?.status ?? "not_started",
    submittedAt: submission?.updatedAt,
  };

  return (
    <CourseProjectClient
      courseId={course.id}
      courseTitle={course.title}
      project={project}
      initialSubmission={submission}
    />
  );
}
