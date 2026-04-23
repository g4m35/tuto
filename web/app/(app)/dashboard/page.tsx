import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowRight, BookOpen, Clock3, Flame, Sparkles } from "lucide-react"
import { buttonVariants } from "@/components/ui/Button"
import { DeepTutorStatusBanner } from "@/components/dashboard/DeepTutorStatusBanner"
import { Progress } from "@/components/ui/progress"
import { toDashboardViewData } from "@/lib/course-data"
import { listCoursesForUser } from "@/lib/course-store"
import { cn } from "@/lib/utils"

function DashboardMetric({
  label,
  value,
  detail,
  className,
}: {
  label: string
  value: string
  detail?: string
  className?: string
}) {
  return (
    <div className={cn("editorial-stat hover-lift p-5", className)}>
      <p className="eyebrow">{label}</p>
      <p className="mt-4 text-[2rem] font-medium leading-none tracking-[-0.04em] text-[var(--text)]">
        {value}
      </p>
      {detail ? (
        <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  try {
    const courses = await listCoursesForUser(userId)
    const dashboard = toDashboardViewData(courses)
    const continueCourse = dashboard.continueCourse
    const hasStubCourses = courses.some((course) => course.backendMode === "stub")
    const completedLessons = dashboard.courses.reduce(
      (total, course) => total + course.lessonsComplete,
      0
    )

    return (
      <div className="flex flex-col gap-10">
        <DeepTutorStatusBanner hasStubCourses={hasStubCourses} />

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_340px] xl:items-end">
          <div className="animate-rise-in space-y-6">
            <p className="eyebrow">This week</p>
            <div className="space-y-4">
              <h1 className="serif max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-[var(--text)] sm:text-6xl">
                {continueCourse
                  ? "Welcome back. Pick up where the idea still feels unstable."
                  : "Welcome in. Tell Tuto what you want to learn next."}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
                {continueCourse
                  ? `You were last working on ${dashboard.insightTopic}. The next session is already shaped around that weak spot, so you can stay inside the thread instead of starting over.`
                  : "Create a course from a topic or source document and the dashboard will start turning your materials into a paced learning path."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={continueCourse ? `/courses/${continueCourse.id}` : "/create"}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                {continueCourse ? "Resume lesson" : "Create course"}
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link
                href="/create"
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
              >
                <Sparkles data-icon="inline-start" />
                Start a new path
              </Link>
            </div>
          </div>

          <aside className="surface-card animate-rise-in-delay-1 p-6">
            <p className="eyebrow">Last 7 days</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between text-sm text-[var(--text-dim)]">
                <span>Courses in motion</span>
                <span className="text-[var(--text)]">{dashboard.courses.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-[var(--text-dim)]">
                <span>Lessons completed</span>
                <span className="text-[var(--text)]">{completedLessons}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-[var(--text-dim)]">
                <span>Current streak</span>
                <span className="text-[var(--text)]">{dashboard.streakDays} days</span>
              </div>
            </div>
            <div className="mt-6 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4">
              <div className="flex items-start gap-3">
                <Flame className="mt-0.5 size-4 text-[var(--accent)]" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--text)]">
                    {continueCourse ? `Next up: ${dashboard.insightTopic}` : "Ready for a first session"}
                  </p>
                  <p className="text-sm leading-6 text-[var(--text-dim)]">
                    {dashboard.continueCopy}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetric
            label="Courses"
            value={String(dashboard.courses.length)}
            detail="currently active"
            className="animate-rise-in-delay-1"
          />
          <DashboardMetric
            label="Mastered"
            value={`${completedLessons}/${Math.max(
              dashboard.courses.reduce((total, course) => total + course.lessonCount, 0),
              1
            )}`}
            detail="lessons complete"
            className="animate-rise-in-delay-2"
          />
          <DashboardMetric
            label="Streak"
            value={`${dashboard.streakDays} days`}
            detail="steady momentum"
            className="animate-rise-in-delay-3"
          />
          <DashboardMetric
            label="Focus"
            value={dashboard.insightTopic}
            detail="current weak spot"
            className="animate-rise-in-delay-4"
          />
        </section>

        <section id="courses" className="scroll-mt-28 space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="eyebrow">Your courses</p>
              <h2 className="serif text-[2.25rem] font-semibold tracking-[-0.05em] text-[var(--text)]">
                Keep moving the tracks that matter.
              </h2>
            </div>
            <Link href="/create" className="text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text)]">
              Create a new course
            </Link>
          </div>

          {dashboard.courses.length ? (
            <div className="flex flex-col gap-3">
              {dashboard.courses.map((course, index) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group editorial-card hover-lift animate-rise-in relative overflow-hidden px-5 py-5 sm:px-6"
                >
                  <span
                    className="absolute left-0 top-4 bottom-4 w-px rounded-full bg-[var(--accent)]/60 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px_120px] lg:items-center">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <span className="size-1 rounded-full bg-[var(--text-faint)]" />
                        <span>{course.subject}</span>
                      </div>
                      <h3 className="text-xl font-medium tracking-[-0.03em] text-[var(--text)]">
                        {course.title}
                      </h3>
                      <p className="text-sm text-[var(--text-dim)]">
                        Next up <span className="text-[var(--text)]">{course.weakness}</span>
                        <span className="mx-2 text-[var(--border-strong)]">·</span>
                        <span>{course.duration}</span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Progress value={course.progress} className="gap-2" />
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">
                        <span>
                          <span className="mr-1 text-[var(--text)]">{course.progress}%</span>
                          in progress
                        </span>
                        <span>
                          <span className="mr-1 text-[var(--text)]">{course.lessonsComplete}</span>
                          complete
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-start lg:justify-end">
                      <span className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                        <BookOpen data-icon="inline-start" />
                        Open
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="editorial-card px-6 py-8 text-sm leading-7 text-[var(--text-dim)]">
              No courses yet. Start from a topic or upload, and the dashboard will replace this shell with your real path.
            </div>
          )}
        </section>
      </div>
    )
  } catch (error) {
    return (
      <div className="editorial-card px-8 py-8">
        <p className="eyebrow">Dashboard unavailable</p>
        <h1 className="serif mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--text)]">
          We could not load your courses.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)]">
          {error instanceof Error ? error.message : "Unexpected dashboard error."}
        </p>
      </div>
    )
  }
}
