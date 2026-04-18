import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowRight, BookOpen, Brain, Clock3 } from "lucide-react"
import { buttonVariants } from "@/components/ui/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DeepTutorStatusBanner } from "@/components/dashboard/DeepTutorStatusBanner"
import { Progress } from "@/components/ui/progress"
import { toDashboardViewData } from "@/lib/course-data"
import { listCoursesForUser } from "@/lib/course-store"
import { cn } from "@/lib/utils"

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

    return (
      <div className="flex flex-col gap-8">
        <DeepTutorStatusBanner hasStubCourses={hasStubCourses} />

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col justify-between gap-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--bg-elev)_80%,transparent)] p-8">
            <div className="space-y-4">
              <p className="eyebrow">Study loop</p>
              <div className="space-y-3">
                <h1 className="serif max-w-3xl text-5xl font-semibold tracking-tight text-balance text-[var(--text)] sm:text-6xl">
                  Welcome back, {dashboard.userName}.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--text-dim)] text-pretty sm:text-lg">
                  {continueCourse
                    ? "Your next session is already shaped. Stay inside the idea that still feels unstable and use the generated exercise while it is fresh."
                    : "Your dashboard is ready. Create a course from a topic or upload, and the next session will start taking shape here."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-faint)]">
                  Active courses
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--text)]">
                  {dashboard.courses.length}
                </p>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-faint)]">
                  Current streak
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--text)]">
                  {dashboard.streakDays} days
                </p>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-faint)]">
                  Focus area
                </p>
                <p className="mt-3 text-2xl font-semibold text-[var(--text)]">
                  {dashboard.insightTopic}
                </p>
              </div>
            </div>
          </div>

          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
            <CardHeader className="border-b border-[var(--border)] px-6 py-6">
              <p className="eyebrow">Continue where you left off</p>
              <CardTitle className="serif text-3xl font-semibold tracking-tight text-[var(--text)]">
                {continueCourse?.title || "No active course yet"}
              </CardTitle>
              <CardDescription className="max-w-md leading-7 text-[var(--text-dim)]">
                {dashboard.continueCopy}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 px-6 py-6">
              {continueCourse ? (
                <>
                  <div className="flex flex-wrap gap-3 text-sm text-[var(--text-dim)]">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2">
                      <BookOpen className="size-4 text-[var(--accent)]" />
                      {continueCourse.lessonsComplete}/{continueCourse.lessonCount} lessons
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2">
                      <Clock3 className="size-4 text-[var(--accent)]" />
                      {continueCourse.duration}
                    </div>
                  </div>
                  <Progress
                    value={continueCourse.progress}
                    className="gap-2"
                  />
                  <p className="text-sm leading-7 text-[var(--text-dim)]">
                    {continueCourse.description}
                  </p>
                </>
              ) : (
                <p className="text-sm leading-7 text-[var(--text-dim)]">
                  Create your first course to populate the dashboard with a learning path and adaptive review.
                </p>
              )}
            </CardContent>
            <CardFooter className="border-[var(--border)] bg-[var(--bg-soft)] px-6 py-5">
              <Link
                href={continueCourse ? `/courses/${continueCourse.id}` : "/create"}
                className={cn(
                  buttonVariants(),
                  "w-full sm:w-auto"
                )}
              >
                {continueCourse ? "Continue session" : "Create first course"}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </CardFooter>
          </Card>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--bg-elev))] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="eyebrow">Insight</p>
              <h2 className="serif text-3xl font-semibold tracking-tight text-[var(--text)]">
                {continueCourse
                  ? `Tuto is keeping a close eye on ${dashboard.insightTopic}.`
                  : "The dashboard is ready to start noticing your weak spots."}
              </h2>
              <p className="max-w-2xl text-base leading-7 text-[var(--text-dim)]">
                {continueCourse
                  ? "We carried your current lesson forward into the next exercise and kept the practice loop narrow instead of flooding you with new material."
                  : "Once a course exists, this panel will summarize which concept needs another pass and how the next exercise changed."}
              </p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-[var(--radius-sm)] border border-[color:color-mix(in_srgb,var(--accent)_24%,var(--border))] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text-dim)]">
              <Brain className="size-5 text-[var(--accent)]" />
              {continueCourse
                ? "Adaptive review is already shaping the next lesson."
                : "Adaptive review starts after the first course generation."}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="eyebrow">Course stack</p>
              <h2 className="serif text-3xl font-semibold tracking-tight text-[var(--text)]">
                Pick the track you want to push forward.
              </h2>
            </div>
            <Link href="/create" className="text-sm font-medium text-[var(--accent)]">
              Create a new course
            </Link>
          </div>

          {dashboard.courses.length ? (
            <div className="grid gap-4 xl:grid-cols-3">
              {dashboard.courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`} className="group">
                  <Card className="surface-card h-full border-[var(--border)] bg-[var(--bg-elev)] py-0 transition-transform duration-200 group-hover:-translate-y-1">
                    <CardHeader className="px-6 py-6">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.22em] text-[var(--text-faint)]">
                          {course.subject}
                        </span>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-xs text-[var(--text-dim)]">
                          {course.progress}%
                        </span>
                      </div>
                      <CardTitle className="serif text-3xl font-semibold tracking-tight text-[var(--text)]">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="leading-7 text-[var(--text-dim)]">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5 px-6 pb-6">
                      <Progress value={course.progress} className="gap-2" />
                      <div className="grid grid-cols-2 gap-3 text-sm text-[var(--text-dim)]">
                        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
                            Pace
                          </p>
                          <p className="mt-2 text-[var(--text)]">{course.intensity}</p>
                        </div>
                        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
                            Weak spot
                          </p>
                          <p className="mt-2 text-[var(--text)]">{course.weakness}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="justify-between border-[var(--border)] bg-[var(--bg-soft)] px-6 py-5">
                      <span className="text-sm text-[var(--text-dim)]">
                        {course.lessonsComplete}/{course.lessonCount} lessons complete
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                        Open course
                        <ArrowRight className="size-4" />
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)]">
              <CardContent className="px-6 py-8 text-sm leading-7 text-[var(--text-dim)]">
                No courses yet. Start with a topic or upload, and the dashboard will replace the mock shell with your real guided sessions.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    )
  } catch (error) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elev)] p-8">
        <p className="eyebrow">Dashboard unavailable</p>
        <h1 className="serif mt-3 text-4xl font-semibold tracking-tight text-[var(--text)]">
          We could not load your courses.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)]">
          {error instanceof Error ? error.message : "Unexpected dashboard error."}
        </p>
      </div>
    )
  }
}
