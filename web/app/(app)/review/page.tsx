import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Braces } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { toCourseCardData } from "@/lib/course-data";
import { listCoursesForUser } from "@/lib/course-store";
import { courseCatalog } from "@/lib/mock-data";
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
  const weakSpots = (courseRecords.length ? courseRecords.map(toCourseCardData) : courseCatalog)
    .slice(0, 3)
    .map((course, index) => ({
      course,
      recall: [72, 61, 48][index] ?? 52,
    }));

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-5">
          <Eyebrow index="{}">Review</Eyebrow>
          <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[48px]">
            A few ideas are starting to slip.
          </h1>
          <p className="max-w-2xl text-[20px] leading-8 text-[var(--text-dim)]">
            Use a short review block to lock the unstable concepts back in before the next lesson opens.
          </p>
        </div>

        <Link href={`/courses/${weakSpots[0]?.course.id ?? "linear-algebra-for-ml"}`} className={cn(buttonVariants({ size: "lg" }))}>
          <Braces data-icon="inline-start" />
          Start review
        </Link>
      </section>

      <section className="grid gap-3">
        {weakSpots.map(({ course, recall }, index) => (
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

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[12px] text-[var(--text-faint)]">
                  <span>Recall confidence</span>
                  <span className="text-[var(--text)]">{recall}%</span>
                </div>
                <div className="h-1 rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-[1100ms] ease-[var(--ease-signature)]"
                    style={{ width: `${recall}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-start lg:justify-end">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                  Review
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
