import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowLeft, ArrowRight, Clock3, Flame, Layers3, LockKeyhole } from "lucide-react"
import { buttonVariants } from "@/components/ui/Button"
import { Progress } from "@/components/ui/progress"
import { ProgressRing } from "@/components/ui/ProgressRing"
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
        <div className="editorial-card px-8 py-8">
          <p className="eyebrow">Course not found</p>
          <h1 className="serif mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--text)]">
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

    const flattenedLessons = course.learningPath.flatMap((level, levelIndex) =>
      level.lessons.map((lesson) => ({
        ...lesson,
        levelTitle: level.title,
        levelIndex,
      }))
    )

    return (
      <div className="flex flex-col gap-10">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="size-4" />
          Back to courses
        </Link>

        <section className="grid gap-10 xl:grid-cols-[minmax(0,1.35fr)_360px] xl:items-start">
          <div className="animate-rise-in space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
              <span>{course.subject}</span>
              <span className="size-1 rounded-full bg-[var(--text-faint)]" />
              <span>{course.level}</span>
              {courseRecord.backendMode === "stub" ? (
                <>
                  <span className="size-1 rounded-full bg-[var(--text-faint)]" />
                  <span>Stubbed backend</span>
                </>
              ) : null}
            </div>

            <div className="space-y-4">
              <h1 className="serif max-w-4xl text-5xl font-semibold tracking-[-0.055em] text-[var(--text)] sm:text-6xl">
                {course.title}
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-[var(--text-dim)] italic">
                {course.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {currentLesson ? (
                <Link
                  href={`/courses/${course.id}/lesson/${currentLesson.id}`}
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Continue
                  <ArrowRight data-icon="inline-end" />
                </Link>
              ) : null}
              <Link
                href={`/courses/${course.id}`}
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
              >
                Practice weak spot
              </Link>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="editorial-card animate-rise-in-delay-1 p-6">
              <div className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">Progress</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-dim)]">
                      Breakdown of how far the path has moved.
                    </p>
                  </div>
                  <ProgressRing value={course.progress} size={88} strokeWidth={4}>
                    <div className="space-y-1">
                      <p className="text-[1.4rem] font-medium leading-none tracking-[-0.05em] text-[var(--text)]">
                        {course.progress}%
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                        done
                      </p>
                    </div>
                  </ProgressRing>
                </div>

                <Progress value={course.progress} className="gap-2" />

                <div className="space-y-3 text-sm text-[var(--text-dim)]">
                  <div className="flex items-center justify-between">
                    <span>Lessons completed</span>
                    <span className="text-[var(--text)]">{course.lessonsComplete}/{course.lessonCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hours invested</span>
                    <span className="text-[var(--text)]">{course.hoursInvested}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Current streak</span>
                    <span className="text-[var(--text)]">{course.streak} days</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="editorial-card animate-rise-in-delay-2 p-5">
              <p className="eyebrow">Session rhythm</p>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-dim)]">
                <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                  <Clock3 className="size-4 text-[var(--text)]" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                  <Layers3 className="size-4 text-[var(--text)]" />
                  {course.intensity}
                </div>
                <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                  <Flame className="size-4 text-[var(--text)]" />
                  Focused review on {course.weakness}
                </div>
              </div>
            </div>

            <div className="editorial-card animate-rise-in-delay-3 p-5">
              <p className="eyebrow">Source material</p>
              <div className="mt-4 space-y-3">
                {course.materials.map((item) => (
                  <div key={item.label + item.detail} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[var(--text)]">{item.label}</p>
                      <span className="text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">
                        {item.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="eyebrow">Learning path</p>
            <h2 className="serif text-[2.5rem] font-semibold tracking-[-0.05em] text-[var(--text)]">
              Move through the path in order.
            </h2>
          </div>

          <div className="space-y-3">
            {flattenedLessons.map((lesson, index) => {
              const lessonHref = `/courses/${course.id}/lesson/${lesson.id}`
              const locked = lesson.state === "locked"
              const current = lesson.state === "current"
              const done = lesson.state === "complete"

              const content = (
                <div className="relative grid gap-4 px-5 py-5 sm:grid-cols-[48px_minmax(0,1fr)_120px] sm:items-center sm:px-6">
                  <div className="relative flex items-center justify-center">
                    {index < flattenedLessons.length - 1 ? (
                      <span
                        className="absolute left-1/2 top-10 bottom-[-28px] w-px -translate-x-1/2 bg-[var(--border)]"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 inline-flex size-7 items-center justify-center rounded-full border text-[10px] font-medium uppercase tracking-[0.08em]",
                        current && "border-[var(--text)] bg-[var(--text)] text-[var(--accent-ink)]",
                        done && "border-[var(--border-strong)] bg-[var(--bg-soft)] text-[var(--text)]",
                        locked && "border-[var(--border)] bg-[var(--bg-elev-2)] text-[var(--text-faint)]"
                      )}
                    >
                      {index + 1}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-faint)]">
                      <span>{lesson.levelTitle}</span>
                      <span className="size-1 rounded-full bg-[var(--text-faint)]" />
                      <span>{lesson.state}</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium tracking-[-0.03em] text-[var(--text)]">
                        {lesson.title}
                      </h3>
                      <p className="max-w-2xl text-sm leading-6 text-[var(--text-dim)]">
                        {lesson.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-start gap-3 text-sm text-[var(--text-dim)] sm:justify-end">
                    <span>{lesson.duration}</span>
                    {locked ? (
                      <span className="inline-flex items-center gap-2 text-[var(--text-faint)]">
                        <LockKeyhole className="size-4" />
                        Locked
                      </span>
                    ) : done ? (
                      <span className="text-[var(--text)]">Mastered</span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-[var(--text)]">
                        Continue
                        <ArrowRight className="size-4" />
                      </span>
                    )}
                  </div>
                </div>
              )

              const wrapperClassName = cn(
                "editorial-card hover-lift animate-rise-in block overflow-hidden",
                current && "border-[var(--border-strong)] bg-[var(--bg-elev-2)]"
              )

              return locked ? (
                <div key={lesson.id} className={wrapperClassName}>
                  {content}
                </div>
              ) : (
                <Link key={lesson.id} href={lessonHref} className={wrapperClassName}>
                  {content}
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    )
  } catch (error) {
    return (
      <div className="editorial-card px-8 py-8">
        <p className="eyebrow">Course unavailable</p>
        <h1 className="serif mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--text)]">
          We could not load this course.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)]">
          {error instanceof Error ? error.message : "Unexpected course error."}
        </p>
      </div>
    )
  }
}
