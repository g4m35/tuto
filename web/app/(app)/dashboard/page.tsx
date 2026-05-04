import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowRight, BookOpen, FileText, Plus, Sparkles } from "lucide-react";
import { ActivityBars } from "@/components/dashboard/ActivityBars";
import { DeepTutorStatusBanner } from "@/components/dashboard/DeepTutorStatusBanner";
import { buttonVariants } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { toCourseDetailData, toDashboardViewData } from "@/lib/course-data";
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

function DashboardMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="editorial-card animate-rise-in min-h-[124px] p-5 sm:p-6">
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-5 flex min-h-10 items-end justify-between gap-4">
        <p className="whitespace-nowrap text-[28px] font-semibold leading-none tracking-normal text-[var(--text)] [font-feature-settings:'tnum','ss01'] [font-variant-numeric:tabular-nums] sm:text-[30px]">
          {value}
        </p>
        {detail ? (
          <p className="pb-0.5 text-right text-[13px] leading-5 text-[var(--text-dim)]">
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
    const displayCourses = courses.slice(0, 4).map(toCourseDetailData);
    const continueCourse = displayCourses[0] ?? null;
    const hasCourses = displayCourses.length > 0;
    const hasStubCourses = courses.some((course) => course.backendMode === "stub");
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
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-stretch">
          <div className="editorial-card animate-rise-in flex min-h-[360px] flex-col justify-between overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
            <div className="space-y-7">
              <Eyebrow>This week · {getWeekday()}</Eyebrow>
              <div className="max-w-[760px]">
                <h1 className="text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[56px]">
                  {`Welcome back, ${displayName}.`}
                </h1>
                {continueCourse ? (
                  <p className="mt-4 max-w-2xl text-[17px] leading-7 text-[var(--text-dim)]">
                    Next up: <span className="text-[var(--text)]">{continueCourse.weakness}</span>
                    <span className="mx-2 text-[var(--text-mute)]">/</span>
                    {continueCourse.title}
                  </p>
                ) : (
                  <p className="mt-4 max-w-2xl text-[17px] leading-7 text-[var(--text-dim)]">
                    Create a course, deck, guide, quiz, cheat sheet, or lesson plan from a topic or source.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {continueCourse ? (
                  <Link
                    href={`/courses/${continueCourse.id}`}
                    className={cn(buttonVariants({ size: "lg" }))}
                  >
                    {continueCourse.artifactAction || "Open"}
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

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                <Sparkles className="size-4 text-[var(--text-faint)]" />
                <p className="mt-3 text-sm font-medium text-[var(--text)]">Generate</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-dim)]">Topic or source to artifact.</p>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                <BookOpen className="size-4 text-[var(--text-faint)]" />
                <p className="mt-3 text-sm font-medium text-[var(--text)]">Learn</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-dim)]">One focused step at a time.</p>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                <FileText className="size-4 text-[var(--text-faint)]" />
                <p className="mt-3 text-sm font-medium text-[var(--text)]">Export</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-dim)]">Docs, slides, HTML, notes.</p>
              </div>
            </div>
          </div>

          <aside className="editorial-card animate-rise-in-delay-1 flex min-h-[360px] flex-col justify-between p-5 sm:p-6">
            <div>
              <Eyebrow>Last 7 days</Eyebrow>
            <div className="mt-6">
              <ActivityBars />
            </div>
            </div>
            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <p className="text-sm font-medium text-[var(--text)]">
                {continueCourse ? continueCourse.title : "Ready when you are"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                {continueCourse
                  ? `${continueCourse.artifactTitle}: ${continueCourse.progress}% complete.`
                  : "Your recent work and generated artifacts will appear here."}
              </p>
            </div>
          </aside>
        </section>

        <DeepTutorStatusBanner hasStubCourses={hasStubCourses} />

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetric
            label="Courses"
            value={String(dashboard.courses.length)}
            detail={dashboard.courses.length ? "Active courses" : "No courses yet"}
          />
          <DashboardMetric
            label="Completed"
            value={`${completedLessons}/${totalLessons}`}
            detail={totalLessons ? `${completionPercent}% complete` : "No lessons yet"}
          />
          <DashboardMetric label="Streak" value={`${dashboard.streakDays} days`} detail="No activity yet" />
          <DashboardMetric label="Mode" value={hasStubCourses ? "Local" : "Live"} detail={hasStubCourses ? "Stub visible" : "Ready"} />
        </section>

        <section id="courses" className="scroll-mt-28 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Eyebrow>Your courses</Eyebrow>
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
                className="group editorial-card interactive-card t-lift animate-rise-in relative overflow-hidden px-5 py-5 sm:px-6"
              >
                <span
                  className="absolute bottom-4 left-0 top-4 w-px bg-[var(--accent)]/80"
                  aria-hidden="true"
                />
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px_150px] lg:items-center">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span className="size-[5px] rounded-[1px] bg-[var(--text-dim)]" />
                      <span>{course.subject}</span>
                      <span className="size-[5px] rounded-[1px] bg-[var(--text-dim)]" />
                      <span>{course.artifactTitle}</span>
                    </div>
                    <h3 className="text-[18px] font-medium leading-[1.35] tracking-normal text-[var(--text)]">
                      {course.title}
                    </h3>
                    <p className="text-[13px] text-[var(--text-dim)]">
                      <span>{course.duration}</span>
                    </p>
                    <p className="text-[13px] text-[var(--text-dim)]">
                      {course.artifactKind === "course" ? "Next" : "Preview"}: <span className="text-[var(--text)]">{course.weakness}</span>
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
                      {course.artifactAction || "Open"}
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
        <Eyebrow>Dashboard unavailable</Eyebrow>
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
