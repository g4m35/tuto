import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Braces } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { toCourseCardData } from "@/lib/course-data";
import { listCoursesForUser } from "@/lib/course-store";
import { cn } from "@/lib/utils";

function Eyebrow({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <p className="t-eyebrow">
      <span className="t-eyebrow__num">{index}</span>
      <span className="t-eyebrow__rule" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export default async function ReviewPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const courseRecords = await listCoursesForUser(userId);
  const weakSpots = courseRecords.map(toCourseCardData).slice(0, 3);
  const hasWeakSpots = weakSpots.length > 0;

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-5">
          <Eyebrow index="{}">Review</Eyebrow>
          <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[48px]">
            {hasWeakSpots ? "Review your current weak spots." : "Nothing to review yet."}
          </h1>
          <p className="max-w-2xl text-[20px] leading-8 text-[var(--text-dim)]">
            {hasWeakSpots
              ? "These review prompts come from your active courses, not placeholder recall scores."
              : "Create a course first, then review items will appear as you make progress."}
          </p>
        </div>

        <Link href={hasWeakSpots ? `/courses/${weakSpots[0]?.id}` : "/create"} className={cn(buttonVariants({ size: "lg" }))}>
          <Braces data-icon="inline-start" />
          {hasWeakSpots ? "Start review" : "Create course"}
        </Link>
      </section>

      <section className="grid gap-3">
        {hasWeakSpots ? weakSpots.map((course, index) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className={cn(
              "editorial-card t-lift block px-5 py-5 sm:px-6",
              index === 0
                ? "animate-rise-in"
                : index === 1
                  ? "animate-rise-in-delay-1"
                  : "animate-rise-in-delay-2"
            )}
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px_120px] lg:items-center">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                  <span>{course.subject}</span>
                  <span className="size-1 rounded-full bg-[var(--text-faint)]" />
                  <span>Weak spot</span>
                </div>
                <h2 className="text-[22px] font-medium leading-[1.25] tracking-normal text-[var(--text)]">
                  {course.weakness}
                </h2>
                <p className="text-[14px] leading-6 text-[var(--text-dim)]">
                  From <span className="text-[var(--text)]">{course.title}</span>
                </p>
              </div>

              <div className="text-[13px] leading-6 text-[var(--text-dim)]">
                <p>
                  <span className="text-[var(--text)]">{course.lessonsComplete}/{course.lessonCount}</span>{" "}
                  lessons completed
                </p>
                <p>{course.progress}% course progress</p>
              </div>

              <div className="flex justify-start lg:justify-end">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                  Review
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </div>
          </Link>
        )) : (
          <div className="editorial-card animate-rise-in px-6 py-8">
            <h2 className="text-[24px] font-medium leading-8 text-[var(--text)]">
              No review data yet.
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-dim)]">
              Review recommendations will be based on your actual course progress once there is something to practice.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
