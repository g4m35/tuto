import { auth } from "@clerk/nextjs/server"
import { LessonExerciseClient } from "@/components/courses/LessonExerciseClient"
import { getLatestExerciseForLesson, getCourseForUser } from "@/lib/course-store"

export default async function LessonExercisePage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>
}) {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const { id, lessonId } = await params
  const course = await getCourseForUser(userId, id)
  const existingExercise = course
    ? await getLatestExerciseForLesson({
        clerkId: userId,
        courseId: id,
        lessonId,
      })
    : null

  return (
    <LessonExerciseClient
      courseId={id}
      lessonId={lessonId}
      initialExercise={existingExercise?.payload ?? null}
    />
  )
}
