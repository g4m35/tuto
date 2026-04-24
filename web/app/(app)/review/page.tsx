import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowRight, Brain, Flame } from "lucide-react"
import { buttonVariants } from "@/components/ui/Button"
import { toCourseCardData } from "@/lib/course-data"
import { listCoursesForUser } from "@/lib/course-store"
import { cn } from "@/lib/utils"

export default async function ReviewPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const courseRecords = await listCoursesForUser(userId)
  const weakSpots = courseRecords
    .map(toCourseCardData)
    .slice(0, 3)
    .map((course, index) => ({
      course,
      recall: Math.max(34, 72 - index * 11 - Math.floor(course.progress / 4)),
    }))

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <p className="eyebrow">Review · spaced recall</p>
        <h1 className="serif max-w-4xl text-5xl font-semibold tracking-[-0.055em] text-[var(--text)] sm:text-6xl">
          {weakSpots.length
            ? "A few ideas are starting to slip."
            : "Review will light up after the first course is underway."}
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
          {weakSpots.length
            ? "Use a short review block to lock the unstable concepts back in before the next lesson opens."
            : "Create a course first and this page will begin surfacing the concepts that need another pass."}
        </p>

        {weakSpots[0] ? (
          <Link href={`/courses/${weakSpots[0].course.id}`} className={cn(buttonVariants({ size: "lg" }))}>
            <Brain data-icon="inline-start" />
            Start review session
          </Link>
        ) : null}
      </section>

      {weakSpots.length ? (
        <section className="space-y-3">
          {weakSpots.map(({ course, recall }, index) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className={cn(
                "editorial-card hover-lift block px-6 py-5",
                index === 0
                  ? "animate-rise-in"
                  : index === 1
                    ? "animate-rise-in-delay-1"
                    : "animate-rise-in-delay-2"
              )}
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px_120px] lg:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
                    <span>{course.subject}</span>
                    <span className="size-1 rounded-full bg-[var(--text-faint)]" />
                    <span>Weak spot</span>
                  </div>
                  <h2 className="text-[1.35rem] font-medium tracking-[-0.04em] text-[var(--text)]">
                    {course.weakness}
                  </h2>
                  <p className="text-sm leading-7 text-[var(--text-dim)]">
                    From <span className="text-[var(--text)]">{course.title}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">
                    <span>Recall confidence</span>
                    <span className="text-[var(--text)]">{recall}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-soft)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
                      style={{ width: `${recall}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-start gap-3 text-sm text-[var(--text-dim)] lg:justify-end">
                  <Flame className="size-4 text-[var(--accent)]" />
                  <span className="inline-flex items-center gap-1 text-[var(--text)]">
                    Review
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="editorial-card px-8 py-8">
          <p className="eyebrow">Nothing to review yet</p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-dim)]">
            Review will become useful once Tuto has enough lesson history to measure what is drifting.
          </p>
        </section>
      )}
    </div>
  )
}
