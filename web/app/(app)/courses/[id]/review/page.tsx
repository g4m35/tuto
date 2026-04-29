import { auth } from "@clerk/nextjs/server";
import { CourseReviewClient, type ReviewPrompt } from "@/components/courses/CourseReviewClient";
import { toCourseDetailData } from "@/lib/course-data";
import { getCourseForUser } from "@/lib/course-store";

export default async function CourseReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const { id } = await params;
  const courseRecord = await getCourseForUser(userId, id);

  if (!courseRecord) {
    return (
      <div className="editorial-card px-8 py-8">
        <p className="eyebrow">Review unavailable</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-[var(--text)]">
          This course could not be found.
        </h1>
      </div>
    );
  }

  const course = toCourseDetailData(courseRecord);
  const prompts: ReviewPrompt[] = course.learningPath.flatMap((level) =>
    level.lessons
      .filter((lesson) => lesson.state === "complete" || lesson.state === "current")
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        unitTitle: level.title,
      })),
  );

  return (
    <CourseReviewClient
      courseId={course.id}
      courseTitle={course.title}
      prompts={prompts.length ? prompts : course.learningPath.flatMap((level) =>
        level.lessons.slice(0, 1).map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          summary: lesson.summary,
          unitTitle: level.title,
        })),
      )}
    />
  );
}
