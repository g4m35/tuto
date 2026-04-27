import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Plus } from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { buttonVariants } from "@/components/ui/Button";
import { toCourseCardData } from "@/lib/course-data";
import { listCoursesForUser } from "@/lib/course-store";
import { cn } from "@/lib/utils";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="t-eyebrow">
      <span className="t-eyebrow__rule" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export default async function CoursesPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const courseRecords = await listCoursesForUser(userId);
  const courses = courseRecords.map(toCourseCardData).slice(0, 6);
  const hasCourses = courses.length > 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="space-y-5">
          <Eyebrow>Your library</Eyebrow>
          <h1 className="text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[48px]">
            All courses <span className="text-[var(--text-dim)]">/{courses.length}</span>
          </h1>
        </div>

        <Link href="/create" className={cn(buttonVariants({ size: "lg" }))}>
          New course
          <Plus data-icon="inline-end" />
        </Link>
      </div>

      {hasCourses ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {courses.map((course, index) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className={cn(
              "editorial-card t-lift group relative min-h-[282px] overflow-hidden px-6 py-6",
              index % 3 === 0
                ? "animate-rise-in"
                : index % 3 === 1
                  ? "animate-rise-in-delay-1"
                  : "animate-rise-in-delay-2"
            )}
          >
            <span className="absolute bottom-4 left-0 top-4 w-px bg-[var(--accent)]/80" aria-hidden="true" />

            <div className="flex items-start justify-between gap-5">
              <span className="text-[12px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <ProgressRing value={course.progress} size={56} strokeWidth={3}>
                <span className="text-[11px] font-medium tracking-[0.02em] text-[var(--text)]">
                  {course.progress}%
                </span>
              </ProgressRing>
            </div>

            <div className="mt-8 space-y-5">
              <div className="space-y-3">
                <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                  {course.subject}
                </p>
                <h2 className="max-w-[320px] text-[21px] font-medium leading-[1.25] tracking-normal text-[var(--text)]">
                  {course.title}
                </h2>
              </div>
              <p className="min-h-[54px] text-[14px] leading-6 text-[var(--text-dim)]">
                {course.description}
              </p>
            </div>

            <div className="mt-8 border-t border-[var(--border)] pt-4">
              <div className="flex items-center justify-between text-[13px] text-[var(--text-dim)]">
                <span>
                  <span className="text-[var(--text)]">{course.lessonsComplete}</span>/{course.lessonCount} lessons
                </span>
                <span className="inline-flex items-center gap-2 text-[var(--text)]">
                  Open
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </div>
          </Link>
          ))}
        </div>
      ) : (
        <div className="editorial-card animate-rise-in px-6 py-8">
          <h2 className="text-[24px] font-medium leading-8 text-[var(--text)]">
            No courses yet.
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-dim)]">
            Your course library will stay empty until you create a course from your own topic or materials.
          </p>
          <Link href="/create" className={cn(buttonVariants({ size: "sm" }), "mt-6")}>
            Create course
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
      )}
    </div>
  );
}
