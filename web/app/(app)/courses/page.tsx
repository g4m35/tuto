import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowRight, Plus } from "lucide-react"
import { ProgressRing } from "@/components/ui/ProgressRing"
import { buttonVariants } from "@/components/ui/Button"
import { toCourseCardData } from "@/lib/course-data"
import { listCoursesForUser } from "@/lib/course-store"
import { cn } from "@/lib/utils"

export default async function CoursesPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const courseRecords = await listCoursesForUser(userId)
  const courses = courseRecords.map(toCourseCardData)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="eyebrow">Your library</p>
          <h1 className="serif text-5xl font-semibold tracking-[-0.055em] text-[var(--text)] sm:text-6xl">
            All courses
            <span className="ml-3 text-[var(--text-dim)]">/{courses.length}</span>
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
            Open the path you want to push forward, or start a fresh course when the next idea is ready.
          </p>
        </div>

        <Link href="/create" className={cn(buttonVariants({ size: "lg" }))}>
          <Plus data-icon="inline-start" />
          New course
        </Link>
      </div>

      {courses.length ? (
        <div className="grid gap-3 xl:grid-cols-3">
          {courses.map((course, index) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className={cn(
                "editorial-card hover-lift group relative overflow-hidden px-6 py-6",
                index % 3 === 0
                  ? "animate-rise-in"
                  : index % 3 === 1
                    ? "animate-rise-in-delay-1"
                    : "animate-rise-in-delay-2"
              )}
            >
              <span className="absolute left-0 top-0 bottom-0 w-px bg-[var(--accent)]/70" aria-hidden="true" />

              <div className="flex items-start justify-between gap-5">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <ProgressRing value={course.progress} size={48} strokeWidth={3}>
                  <span className="text-[10px] font-medium tracking-[0.08em] text-[var(--text)]">
                    {course.progress}%
                  </span>
                </ProgressRing>
              </div>

              <div className="mt-5 space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">
                  {course.subject}
                </p>
                <h2 className="text-[1.4rem] font-medium tracking-[-0.04em] text-[var(--text)]">
                  {course.title}
                </h2>
                <p className="text-sm leading-7 text-[var(--text-dim)]">
                  {course.description}
                </p>
              </div>

              <div className="mt-6 border-t border-[var(--border)] pt-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  <span>
                    <span className="mr-1 text-[var(--text)]">{course.lessonsComplete}</span>
                    of {course.lessonCount} lessons
                  </span>
                  <span className="inline-flex items-center gap-1 text-[var(--text)]">
                    Open
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="editorial-card px-8 py-8">
          <p className="eyebrow">No courses yet</p>
          <h2 className="serif mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--text)]">
            The library will fill in once you create the first path.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)]">
            Start from a topic or upload, and Tuto will turn it into a paced course with review loops and lesson checkpoints.
          </p>
        </div>
      )}
    </div>
  )
}
