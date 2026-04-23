import { auth } from "@clerk/nextjs/server"
import { DashboardExperience } from "@/components/dashboard/DashboardExperience"
import { toDashboardViewData } from "@/lib/course-data"
import { listCoursesForUser } from "@/lib/course-store"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  try {
    const courses = await listCoursesForUser(userId)
    const dashboard = toDashboardViewData(courses)
    const hasStubCourses = courses.some((course) => course.backendMode === "stub")

    return <DashboardExperience dashboard={dashboard} hasStubCourses={hasStubCourses} />
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
