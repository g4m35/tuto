import Link from "next/link"
import { ArrowRight, BookCopy, ChevronRight, Clock3, Flame, Layers3 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getCourseDetail } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const course = getCourseDetail(id)

  return (
    <div className="flex flex-col gap-8">
      <nav className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
        <Link href="/dashboard" className="hover:text-[var(--text)]">
          Dashboard
        </Link>
        <ChevronRight className="size-4 text-[var(--text-faint)]" />
        <span className="text-[var(--text)]">{course.title}</span>
      </nav>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
          <CardHeader className="gap-4 border-b border-[var(--border)] px-7 py-7">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-dim)]">
              <span className="eyebrow">{course.subject}</span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1">
                {course.level}
              </span>
            </div>
            <div className="space-y-3">
              <CardTitle className="serif max-w-3xl text-5xl font-semibold tracking-tight text-[var(--text)]">
                {course.title}
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7 text-[var(--text-dim)]">
                {course.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 px-7 py-7 md:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    Progress
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--text)]">
                    {course.progress}%
                  </p>
                </div>
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    Hours invested
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--text)]">
                    {course.hoursInvested}
                  </p>
                </div>
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    Streak
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--text)]">
                    {course.streak} days
                  </p>
                </div>
              </div>
              <Progress value={course.progress} className="gap-2" />
            </div>

            <div className="space-y-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--bg-soft))] p-5">
              <p className="eyebrow">Source materials</p>
              <div className="space-y-3">
                {course.materials.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[var(--text)]">{item.label}</p>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-xs text-[var(--text-dim)]">
                        {item.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)]">
            <CardHeader>
              <CardTitle className="text-lg text-[var(--text)]">
                Session rhythm
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-[var(--text-dim)]">
              <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                <Clock3 className="size-4 text-[var(--accent)]" />
                {course.duration}
              </div>
              <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                <Layers3 className="size-4 text-[var(--accent)]" />
                {course.intensity}
              </div>
              <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                <Flame className="size-4 text-[var(--accent)]" />
                Focused remediation on {course.weakness}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)]">
            <CardHeader>
              <CardTitle className="text-lg text-[var(--text)]">
                Next lesson
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/courses/${course.id}/lesson/eigenvector-intuition`}
                className="group flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-medium text-[var(--text)]"
              >
                Open current exercise
                <ArrowRight className="size-4 text-[var(--accent)] transition-transform group-hover:translate-x-1" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">Learning path</p>
          <h2 className="serif text-4xl font-semibold tracking-tight text-[var(--text)]">
            Move through the path in order.
          </h2>
        </div>

        <div className="grid gap-5">
          {course.learningPath.map((level, index) => (
            <Card
              key={level.id}
              className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0"
            >
              <CardHeader className="border-b border-[var(--border)] px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-faint)]">
                      Level {index + 1}
                    </span>
                    <CardTitle className="serif text-3xl font-semibold tracking-tight text-[var(--text)]">
                      {level.title}
                    </CardTitle>
                    <CardDescription className="max-w-2xl text-[var(--text-dim)]">
                      {level.description}
                    </CardDescription>
                  </div>
                  <div className="min-w-56 space-y-2">
                    <div className="flex items-center justify-between text-sm text-[var(--text-dim)]">
                      <span>Completion</span>
                      <span>{level.completion}%</span>
                    </div>
                    <Progress value={level.completion} className="gap-2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
                {level.lessons.map((lesson) => {
                  const lessonHref = `/courses/${course.id}/lesson/${lesson.id}`
                  const lessonClassName = cn(
                    "flex h-full flex-col gap-4 rounded-[var(--radius-sm)] border p-4",
                    lesson.state === "current" &&
                      "border-[color:color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_8%,var(--bg-soft))]",
                    lesson.state === "complete" &&
                      "border-[var(--border)] bg-[var(--bg-soft)]",
                    lesson.state === "locked" &&
                      "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--bg-soft)_72%,var(--bg))] opacity-70"
                  )

                  const content = (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
                            {lesson.state}
                          </p>
                          <h3 className="mt-2 text-lg font-medium text-[var(--text)]">
                            {lesson.title}
                          </h3>
                        </div>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-xs text-[var(--text-dim)]">
                          {lesson.xp} XP
                        </span>
                      </div>
                      <p className="flex-1 text-sm leading-6 text-[var(--text-dim)]">
                        {lesson.summary}
                      </p>
                      <div className="flex items-center justify-between text-sm text-[var(--text-dim)]">
                        <span>{lesson.duration}</span>
                        {lesson.state !== "locked" ? (
                          <span className="inline-flex items-center gap-2 text-[var(--accent)]">
                            Open lesson
                            <ArrowRight className="size-4" />
                          </span>
                        ) : (
                          <span>Finish the current lesson first</span>
                        )}
                      </div>
                    </>
                  )

                  return (
                    <Link
                      key={lesson.id}
                      href={lessonHref}
                      className={lessonClassName}
                    >
                      {content}
                    </Link>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
