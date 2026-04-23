import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Flame,
  Layers3,
  Sparkles,
  Target,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CourseDetailSectionNav } from "@/components/courses/CourseDetailSectionNav"
import { Progress } from "@/components/ui/progress"
import { findLesson, toCourseDetailData } from "@/lib/course-data"
import { getCourseForUser } from "@/lib/course-store"
import { cn } from "@/lib/utils"

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  try {
    const { id } = await params
    const courseRecord = await getCourseForUser(userId, id)

    if (!courseRecord) {
      return (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elev)] p-8">
          <p className="eyebrow">Course not found</p>
          <h1 className="serif mt-3 text-4xl font-semibold tracking-tight text-[var(--text)]">
            This course has not been created yet.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)]">
            Head back to the create flow and generate a course first.
          </p>
        </div>
      )
    }

    const course = toCourseDetailData(courseRecord)
    const currentLesson =
      findLesson(courseRecord, courseRecord.currentLessonId || "") ??
      course.learningPath.flatMap((level) => level.lessons).find((lesson) => lesson.state === "current") ??
      course.learningPath.flatMap((level) => level.lessons)[0]
    const sectionLinks = [
      { id: "overview", label: "Overview" },
      { id: "path", label: "Learning path" },
      { id: "materials", label: "Materials" },
    ]
    const statItems = [
      { label: "Progress", value: `${course.progress}%`, detail: "completion", icon: Target },
      {
        label: "Hours invested",
        value: `${course.hoursInvested}`,
        detail: "guided practice",
        icon: Clock3,
      },
      { label: "Streak", value: `${course.streak} days`, detail: "steady rhythm", icon: Flame },
    ]
    const rhythmItems = [
      {
        title: "Session cadence",
        body: course.duration,
        icon: Clock3,
      },
      {
        title: "Course mode",
        body: course.intensity,
        icon: Layers3,
      },
      {
        title: "Current focus",
        body: `Focused remediation on ${course.weakness}`,
        icon: Flame,
      },
    ]

    return (
      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="surface-card hidden h-fit flex-col rounded-[30px] p-4 xl:sticky xl:top-24 xl:flex">
          <div className="border-b border-[var(--border)] px-2 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
              Course workspace
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">
              {course.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{course.subject}</p>
          </div>
          <CourseDetailSectionNav items={sectionLinks} />

          <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)]/78 p-4">
            <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--bg-elev)] text-[var(--accent)] shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-faint)]">
              Current lesson
            </p>
            <h3 className="mt-2 text-base font-semibold text-[var(--text)]">
              {currentLesson ? currentLesson.title : "Awaiting first lesson"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
              {currentLesson
                ? `${currentLesson.duration} and ready to resume from the active step.`
                : "Generate lessons for this course and the active exercise will appear here."}
            </p>
            {currentLesson ? (
              <Link
                href={`/courses/${course.id}/lesson/${currentLesson.id}`}
                className="group mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]"
              >
                Open current exercise
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : null}
          </div>

          <Link
            href="/dashboard"
            className="mt-auto inline-flex items-center gap-2 px-2 pt-6 text-sm font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
          >
            Back to dashboard
            <ArrowRight className="size-4" />
          </Link>
        </aside>

        <div className="flex flex-col gap-6">
          <CourseDetailSectionNav items={sectionLinks} mobile />

          <section
            id="overview"
            className="surface-card overflow-hidden rounded-[32px] p-6 sm:p-8"
          >
            <div className="app-grid rounded-[28px] border border-[var(--border)] bg-[var(--bg-elev)]/72 p-5 sm:p-6">
              <nav className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
                <Link
                  href="/dashboard"
                  className="transition-colors duration-200 hover:text-[var(--text)]"
                >
                  Dashboard
                </Link>
                <ChevronRight className="size-4 text-[var(--text-faint)]" />
                <span className="truncate text-[var(--text)]">{course.title}</span>
              </nav>

              <div className="mt-5 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-faint)]">
                      <Sparkles className="size-3.5 text-[var(--accent)]" />
                      {course.subject}
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-[13px] text-[var(--text-dim)]">
                      {course.level}
                    </span>
                    {courseRecord.backendMode === "stub" ? (
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-[13px] text-[var(--text-dim)]">
                        Stubbed backend
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
                      {course.title}
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-[var(--text-dim)] sm:text-lg">
                      {course.description}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {statItems.map((item) => {
                      const Icon = item.icon

                      return (
                        <div
                          key={item.label}
                          className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-elev)]/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-faint)]">
                              {item.label}
                            </p>
                            <Icon className="size-4 text-[var(--accent)]" />
                          </div>
                          <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text)]">
                            {item.value}
                          </p>
                          <p className="mt-1 text-sm text-[var(--text-dim)]">{item.detail}</p>
                        </div>
                      )
                    })}
                  </div>

                  <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-soft)]/72 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="space-y-2">
                        <p className="eyebrow">Course progress</p>
                        <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-[2rem]">
                          {course.lessonsComplete} of {course.lessonCount} steps completed.
                        </h2>
                        <p className="max-w-2xl text-sm leading-6 text-[var(--text-dim)] sm:text-base">
                          The course stays centered on one clear next move, with supporting details
                          kept quiet until you need them.
                        </p>
                      </div>

                      {currentLesson ? (
                        <Link
                          href={`/courses/${course.id}/lesson/${currentLesson.id}`}
                          className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-5 py-3 text-sm font-medium text-[var(--text)] transition-all duration-200 hover:border-[color:color-mix(in_srgb,var(--accent)_22%,var(--border))] hover:text-[var(--accent)]"
                        >
                          Resume lesson
                          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                      ) : null}
                    </div>

                    <Progress value={course.progress} className="mt-5 gap-2" />

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--text-dim)]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1.5">
                        <BookOpen className="size-4 text-[var(--accent)]" />
                        {course.lessonCount} total steps
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1.5">
                        <Target className="size-4 text-[var(--accent)]" />
                        Focused on {course.weakness}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--accent)_9%,var(--bg-soft))] p-5">
                    <p className="eyebrow">Next lesson</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">
                      {currentLesson ? currentLesson.title : "No lessons generated yet"}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-dim)] sm:text-base">
                      {currentLesson
                        ? `Resume the active exercise, keep the review loop tight, and let the next step continue adapting around ${course.weakness}.`
                        : "Once a lesson exists, the active exercise will appear here with the next direct action."}
                    </p>

                    {currentLesson ? (
                      <Link
                        href={`/courses/${course.id}/lesson/${currentLesson.id}`}
                        className="group mt-5 flex items-center justify-between rounded-[22px] border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-3 text-sm font-medium text-[var(--text)] transition-all duration-200 hover:border-[color:color-mix(in_srgb,var(--accent)_22%,var(--border))] hover:shadow-[0_16px_35px_rgba(15,23,42,0.06)]"
                      >
                        Open current exercise
                        <ArrowRight className="size-4 text-[var(--accent)] transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                    ) : (
                      <p className="mt-5 text-sm text-[var(--text-dim)]">
                        No lessons have been generated for this course yet.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {rhythmItems.map((item) => {
                      const Icon = item.icon

                      return (
                        <div
                          key={item.title}
                          className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-elev)]/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--accent)_18%,var(--border))]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--accent)] shadow-sm">
                              <Icon className="size-[18px]" />
                            </div>
                            <div>
                              <p className="font-medium text-[var(--text)]">{item.title}</p>
                              <p className="mt-1 text-sm leading-6 text-[var(--text-dim)]">
                                {item.body}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="path" className="surface-card rounded-[32px] p-6 sm:p-8">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="eyebrow">Learning path</p>
                <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-[2.2rem]">
                  Move through the path in order.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-[var(--text-dim)] sm:text-base">
                  Each level keeps the next step obvious, with completed work quiet in the
                  background and the active lesson surfaced first.
                </p>
              </div>
              <div className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-2 text-sm text-[var(--text-dim)]">
                {course.learningPath.length} levels in this course
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              {course.learningPath.map((level, index) => (
                <Card
                  key={level.id}
                  className="overflow-hidden rounded-[28px] border-[var(--border)] bg-[var(--bg-elev)]/92 py-0 shadow-[0_18px_45px_rgba(15,23,42,0.04)]"
                >
                  <CardHeader className="border-b border-[var(--border)] px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-faint)]">
                          Level {index + 1}
                        </span>
                        <CardTitle className="text-3xl font-semibold tracking-tight text-[var(--text)]">
                          {level.title}
                        </CardTitle>
                        <CardDescription className="max-w-2xl text-[var(--text-dim)]">
                          {level.description}
                        </CardDescription>
                      </div>
                      <div className="min-w-56 space-y-2 rounded-[22px] border border-[var(--border)] bg-[var(--bg-soft)]/68 p-4">
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
                        "group/lesson flex h-full flex-col gap-4 rounded-[24px] border p-5 transition-all duration-200 ease-out",
                        lesson.state !== "locked" &&
                          "hover:-translate-y-1 hover:border-[color:color-mix(in_srgb,var(--accent)_26%,var(--border))] hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)]",
                        lesson.state === "current" &&
                          "border-[color:color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_8%,var(--bg-soft))] shadow-[0_18px_40px_rgba(15,23,42,0.06)]",
                        lesson.state === "complete" &&
                          "border-[var(--border)] bg-[var(--bg-soft)]/76",
                        lesson.state === "locked" &&
                          "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--bg-soft)_72%,var(--bg))] opacity-70"
                      )

                      const content = (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)] capitalize">
                                {lesson.state}
                              </p>
                              <h3 className="mt-2 text-lg font-medium text-[var(--text)]">
                                {lesson.title}
                              </h3>
                            </div>
                            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1 text-xs text-[var(--text-dim)]">
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
                                <ArrowRight className="size-4 transition-transform duration-200 group-hover/lesson:translate-x-1" />
                              </span>
                            ) : (
                              <span>Finish the current lesson first</span>
                            )}
                          </div>
                        </>
                      )

                      return lesson.state === "locked" ? (
                        <div
                          key={lesson.id}
                          className={lessonClassName}
                        >
                          {content}
                        </div>
                      ) : (
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

          <section id="materials" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-card rounded-[32px] p-6 sm:p-8">
              <div className="space-y-2 border-b border-[var(--border)] pb-5">
                <p className="eyebrow">Source materials</p>
                <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)]">
                  What this course was built from.
                </h2>
              </div>

              <div className="mt-6 space-y-3">
                {course.materials.map((item) => (
                  <div
                    key={item.label + item.detail}
                    className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-elev)]/92 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--accent)_18%,var(--border))] hover:shadow-[0_18px_42px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[var(--text)]">{item.label}</p>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-xs text-[var(--text-dim)]">
                        {item.type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card rounded-[32px] p-6 sm:p-8">
              <p className="eyebrow">Course signal</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)]">
                Keep the workspace calm and the next move obvious.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-dim)] sm:text-base">
                This course is tuned around {course.weakness}, uses {course.intensity.toLowerCase()},
                and keeps momentum through a {course.duration.toLowerCase()} rhythm.
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)]/72 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-faint)]">
                    Recommendation
                  </p>
                  <p className="mt-3 text-base font-medium text-[var(--text)]">
                    Resume the active lesson before unlocking the next branch.
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)]/72 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-faint)]">
                    Why it matters
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                    The layout stays intentionally minimal so progress, active review, and the next
                    lesson remain the strongest visual signals on the page.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="surface-card rounded-[32px] p-6 sm:p-8">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-elev)]/72 p-6 sm:p-8">
          <p className="eyebrow">Course unavailable</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--text)]">
            We could not load this course.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)]">
            {error instanceof Error ? error.message : "Unexpected course error."}
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-5 py-3 text-sm font-medium text-[var(--text)] transition-colors hover:text-[var(--accent)]"
            >
              Return to dashboard
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }
}
