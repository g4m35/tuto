import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowLeft, ArrowRight, CalendarClock, Download, Hammer, LockKeyhole, Target } from "lucide-react"
import { CourseArtifactActions } from "@/components/courses/CourseArtifactActions"
import { buttonVariants } from "@/components/ui/Button"
import { Progress } from "@/components/ui/progress"
import {
  getPrimaryCourseArtifactActionLabel,
  getPrimaryCourseArtifactExportFormat,
  isInteractiveCourseArtifact,
} from "@/lib/course-artifacts"
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
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-[var(--text)]">
            This course has not been created yet.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)]">
            Head back to the create flow and generate a course first.
          </p>
        </div>
      )
    }

    const course = toCourseDetailData(courseRecord)
    const isInteractiveCourse = isInteractiveCourseArtifact(course.artifactKind)
    const primaryArtifactFormat = getPrimaryCourseArtifactExportFormat(course.artifactKind)
    const primaryArtifactLabel = getPrimaryCourseArtifactActionLabel(course.artifactKind)
    const artifactPoints = Array.isArray(courseRecord.guidePayload.knowledge_points)
      ? courseRecord.guidePayload.knowledge_points
      : []
    const allLessons = course.learningPath.flatMap((level) => level.lessons)
    const nextLesson =
      isInteractiveCourse
        ? findLesson(courseRecord, courseRecord.currentLessonId || "") ??
          allLessons.find((lesson) => lesson.state === "current") ??
          allLessons.find((lesson) => lesson.state !== "complete") ??
          null
        : null

    const flattenedLessons = course.learningPath.flatMap((level, levelIndex) =>
      level.lessons.map((lesson) => ({
        ...lesson,
        levelTitle: level.title,
        levelIndex,
      }))
    )

    return (
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-7">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="size-4" />
          Back to courses
        </Link>

        <section className="editorial-card animate-rise-in overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
              <span>{course.subject}</span>
              <span className="size-1 rounded-full bg-[var(--text-faint)]" />
              <span>{course.level}</span>
              <span className="size-1 rounded-full bg-[var(--text-faint)]" />
              <span>{course.artifactTitle}</span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[56px]">
                {course.title}
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-[var(--text-dim)]">
                {course.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isInteractiveCourse && nextLesson ? (
                <Link
                  href={`/courses/${course.id}/lesson/${nextLesson.id}`}
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Continue course
                  <ArrowRight data-icon="inline-end" />
                </Link>
              ) : isInteractiveCourse ? (
                <span className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
                  Course complete
                </span>
              ) : (
                <>
                  <Link
                    href={`/api/courses/${course.id}/download?format=${primaryArtifactFormat}`}
                    className={cn(buttonVariants({ size: "lg" }))}
                  >
                    <Download data-icon="inline-start" />
                    {primaryArtifactLabel}
                  </Link>
                  <a
                    href="#artifact-preview"
                    className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                  >
                    Preview outline
                  </a>
                </>
              )}
            </div>
          </div>

          {isInteractiveCourse ? (
            <div className="mt-8 max-w-[720px] space-y-3 border-t border-[var(--border)] pt-6">
              <div className="flex items-center justify-between text-sm text-[var(--text-dim)]">
                <span>{course.lessonsComplete}/{course.lessonCount} lessons complete</span>
                <span className="text-[var(--text)]">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="gap-2" />
            </div>
          ) : null}
        </section>

        {courseRecord.backendMode === "stub" ? (
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-3 text-sm text-[var(--text)]">
            <p className="font-medium">Local stub generation</p>
            <p className="mt-1 text-[var(--text-dim)]">
              This artifact used the localhost fallback because the configured DeepTutor backend was unreachable. Start DeepTutor at{" "}
              <code className="font-mono">DEEPTUTOR_URL</code> for production-like generation.
            </p>
          </div>
        ) : null}

        <CourseArtifactActions
          courseId={courseRecord.id}
          artifactTitle={course.artifactTitle || "Artifact"}
          artifactKind={course.artifactKind}
          initialShareEnabled={courseRecord.shareEnabled}
          initialShareToken={courseRecord.shareToken}
        />

        {!isInteractiveCourse ? (
          <section id="artifact-preview" className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end">
              <div className="space-y-2">
                <p className="eyebrow">Artifact preview</p>
                <h2 className="text-[34px] font-semibold tracking-normal text-[var(--text)]">
                  {course.artifactPreviewTitle || `${course.artifactTitle} outline`}
                </h2>
              </div>
              <div className="editorial-card px-5 py-4">
                <p className="text-sm font-medium text-[var(--text)]">Ready to export</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                  Preview, then export.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {artifactPoints.length ? (
                artifactPoints.map((point, index) => (
                  <article key={`${point.knowledge_title}-${index}`} className="editorial-card animate-rise-in flex min-h-[190px] flex-col justify-between px-5 py-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-4 text-xl font-medium leading-7 text-[var(--text)]">
                      {point.knowledge_title || `Section ${index + 1}`}
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                      {point.knowledge_summary || point.user_difficulty || "Generated by Tuto."}
                    </p>
                  </article>
                ))
              ) : (
                <div className="editorial-card px-5 py-5 text-sm text-[var(--text-dim)]">
                  No generated sections are available yet.
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-3 md:grid-cols-3">
              <div className="course-metric-card editorial-card animate-rise-in-delay-1 px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">Mastery</p>
                  <Target className="size-4 text-[var(--text-dim)]" />
                </div>
                <p className="mt-5 text-[34px] font-semibold leading-none tracking-normal text-[var(--text)]">
                  {course.masteryPercent ?? 0}%
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                  Based on lessons and checkpoints.
                </p>
              </div>

              <Link
                href={`/courses/${course.id}/review`}
                className="course-metric-card editorial-card animate-rise-in-delay-2 px-5 py-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">Review due</p>
                  <CalendarClock className="size-4 text-[var(--text-dim)]" />
                </div>
                <p className="mt-5 text-[34px] font-semibold leading-none tracking-normal text-[var(--text)]">
                  {course.reviewDueCount ?? 0}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                  Spaced practice prompts from lessons that need another pass.
                </p>
              </Link>

              <div className="course-metric-card editorial-card animate-rise-in-delay-3 px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">Projects</p>
                  <Hammer className="size-4 text-[var(--text-dim)]" />
                </div>
                <p className="mt-5 text-[34px] font-semibold leading-none tracking-normal text-[var(--text)]">
                  {course.projectCount ?? course.learningPath.length}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                  Unit projects turn lessons into skill.
                </p>
              </div>
            </section>

            <section className="space-y-5">
              <div className="space-y-2">
                <p className="eyebrow">Learning path</p>
                <h2 className="text-[34px] font-semibold tracking-normal text-[var(--text)]">
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
                            current && "border-[var(--accent-strong)] bg-[var(--accent)] text-[var(--accent-ink)]",
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
                          {current ? (
                            <>
                              <span className="size-1 rounded-full bg-[var(--text-faint)]" />
                              <span>interactive</span>
                            </>
                          ) : null}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-medium tracking-normal text-[var(--text)]">
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
                    "editorial-card animate-rise-in block overflow-hidden",
                    locked ? "opacity-75" : "interactive-card hover-lift cursor-pointer",
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

            <section className="space-y-4">
              <div className="space-y-2">
                <p className="eyebrow">Unit projects</p>
                <h2 className="text-[34px] font-semibold tracking-normal text-[var(--text)]">
                  Prove it in context.
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {course.learningPath.map((level, index) => (
                  <Link
                    key={level.id}
                    href={`/courses/${course.id}/project/${level.id}`}
                    className={cn(
                      "editorial-card interactive-card t-lift px-5 py-5",
                      index % 2 === 0 ? "animate-rise-in-delay-1" : "animate-rise-in-delay-2",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
                          {level.title}
                        </p>
                        <h3 className="mt-3 text-lg font-medium leading-7 text-[var(--text)]">
                          {level.projectTitle}
                        </h3>
                      </div>
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-sm text-[var(--text)]">
                        {level.mastery ?? 0}%
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[var(--text-dim)]">
                      Finish the unit, then apply the main idea without hints.
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="editorial-card px-8 py-8">
        <p className="eyebrow">Course unavailable</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-[var(--text)]">
          We could not load this course.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)]">
          {error instanceof Error ? error.message : "Unexpected course error."}
        </p>
      </div>
    )
  }
}
