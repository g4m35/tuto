import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowRight, Plus } from "lucide-react";
import { ActivityBars } from "@/components/dashboard/ActivityBars";
import { buttonVariants } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { toDashboardViewData } from "@/lib/course-data";
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

function DashboardMetric({
  index,
  label,
  value,
  detail,
}: {
  index: string;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="editorial-card t-lift animate-rise-in min-h-[132px] p-5 sm:p-6">
      <Eyebrow index={index}>{label}</Eyebrow>
      <div className="mt-5 flex min-h-12 items-end justify-between gap-4">
        <p className="whitespace-pre-line text-[34px] font-semibold leading-[1.02] tracking-normal text-[var(--text)] [font-feature-settings:'tnum','ss01'] [font-variant-numeric:tabular-nums]">
          {value}
        </p>
        {detail ? (
          <p className="pb-1 text-right text-[13px] leading-5 text-[var(--text-dim)]">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function getDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  return (
    user?.firstName ||
    user?.username ||
    user?.emailAddresses[0]?.emailAddress.split("@")[0] ||
    "there"
  );
}

function getWeekday() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const user = await currentUser();
    const courses = await listCoursesForUser(userId);
    const dashboard = toDashboardViewData(courses);
    const displayCourses = dashboard.courses.slice(0, 3);
    const continueCourse = displayCourses[0] ?? null;
    const hasCourses = displayCourses.length > 0;
    const displayName = getDisplayName(user);
    const totalLessons = dashboard.courses.reduce((sum, course) => sum + course.lessonCount, 0);
    const completedLessons = dashboard.courses.reduce(
      (sum, course) => sum + course.lessonsComplete,
      0
    );
    const completionPercent = totalLessons
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    return (
      <div className="flex flex-col gap-10">
        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] xl:items-end">
          <div className="animate-rise-in space-y-7">
            <Eyebrow index="/">This week · {getWeekday()}</Eyebrow>
            <div className="max-w-[760px]">
              <h1 className="text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[56px]">
                {hasCourses ? `Welcome back, ${displayName}.` : `Welcome, ${displayName}.`}
              </h1>
              <p className="mt-1 text-[40px] font-light leading-[1.05] tracking-normal text-[var(--text-dim)] sm:text-[56px]">
                {continueCourse
                  ? `Pick up where you left - ${continueCourse.weakness}.`
                  : "Create your first course to start learning."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {continueCourse ? (
                <Link
                  href={`/courses/${continueCourse.id}`}
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Resume lesson
                  <ArrowRight data-icon="inline-end" />
                </Link>
              ) : null}
              <Link
                href="/create"
                className={cn(
                  buttonVariants({ variant: continueCourse ? "ghost" : "default", size: "lg" })
                )}
              >
                <Plus data-icon="inline-start" />
                Create new course
              </Link>
            </div>
          </div>

          <aside className="editorial-card animate-rise-in-delay-1 p-5 sm:p-6">
            <Eyebrow index="//">Last 7 days</Eyebrow>
            <div className="mt-6">
              <ActivityBars />
            </div>
          </aside>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetric
            index="i"
            label="Courses"
            value={String(dashboard.courses.length)}
            detail={dashboard.courses.length ? "Active courses" : "No courses yet"}
          />
          <DashboardMetric
            index="ii"
            label="Completed"
            value={`${completedLessons}/${totalLessons}`}
            detail={totalLessons ? `${completionPercent}% complete` : "No lessons yet"}
          />
          <DashboardMetric index="iii" label="Streak" value={`${dashboard.streakDays}\ndays`} detail="No activity yet" />
          <DashboardMetric index="iv" label="Pace" value="0" />
        </section>

        <section id="courses" className="scroll-mt-28 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Eyebrow index="///">Your courses</Eyebrow>
            {hasCourses ? (
              <Link href="/courses" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text)]">
                See all
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            {hasCourses ? displayCourses.map((course, index) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group editorial-card t-lift animate-rise-in relative overflow-hidden px-5 py-4 sm:px-6"
              >
                <span
                  className="absolute bottom-4 left-0 top-4 w-px bg-[var(--accent)]/80"
                  aria-hidden="true"
                />
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px_120px] lg:items-center">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span className="size-[5px] rounded-[1px] bg-[var(--text-dim)]" />
                      <span>{course.subject}</span>
                    </div>
                    <h3 className="text-[18px] font-medium leading-[1.35] tracking-normal text-[var(--text)]">
                      {course.title}
                    </h3>
                    <p className="text-[13px] text-[var(--text-dim)]">
                      Next - <span className="text-[var(--text)]">{course.weakness}</span>
                      <span className="mx-2 text-[var(--text-mute)]">·</span>
                      <span>{course.duration}</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Progress value={course.progress} className="gap-2" />
                    <div className="flex items-center justify-between text-[13px] text-[var(--text-faint)]">
                      <span>
                        <span className="mr-1 text-[var(--text)]">{course.progress}%</span>
                        in progress
                      </span>
                      <span>
                        <span className="mr-1 text-[var(--text)]">{course.lessonsComplete}/{course.lessonCount}</span>
                        completed
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    <span className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                      Resume
                      <ArrowRight data-icon="inline-end" />
                    </span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="editorial-card animate-rise-in px-5 py-6 sm:px-6">
                <h3 className="text-[20px] font-medium leading-7 text-[var(--text)]">
                  No courses yet.
                </h3>
                <p className="mt-2 max-w-xl text-[14px] leading-6 text-[var(--text-dim)]">
                  Create a course and this section will show only your real learning progress.
                </p>
                <Link href="/create" className={cn(buttonVariants({ size: "sm" }), "mt-5")}>
                  Create course
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  } catch (error) {
    return (
      <div className="editorial-card px-8 py-8">
        <Eyebrow index="!">Dashboard unavailable</Eyebrow>
        <h1 className="mt-4 text-[34px] font-semibold leading-[1.15] tracking-normal text-[var(--text)]">
          We could not load your courses.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)]">
          {error instanceof Error ? error.message : "Unexpected dashboard error."}
        </p>
      </div>
    );
  }
}
