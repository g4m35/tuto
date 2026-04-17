export type CourseLevel = "Beginner" | "Intermediate" | "Advanced"
export type LessonState = "complete" | "current" | "locked"

export interface CourseCardData {
  id: string
  title: string
  subject: string
  description: string
  progress: number
  lessonsComplete: number
  lessonCount: number
  duration: string
  intensity: string
  weakness: string
}

export interface MaterialItem {
  label: string
  type: string
  detail: string
}

export interface LessonNode {
  id: string
  title: string
  summary: string
  state: LessonState
  xp: number
  duration: string
}

export interface LearningLevel {
  id: string
  title: string
  description: string
  completion: number
  lessons: LessonNode[]
}

export interface CourseDetailData extends CourseCardData {
  level: CourseLevel
  streak: number
  hoursInvested: number
  materials: MaterialItem[]
  learningPath: LearningLevel[]
}

export interface ExerciseOption {
  id: string
  label: string
  body: string
}

export interface ExerciseData {
  courseId: string
  lessonId: string
  title: string
  prompt: string
  step: number
  stepCount: number
  xp: number
  options: ExerciseOption[]
  hint: string
}

export const courseCatalog: CourseCardData[] = [
  {
    id: "linear-algebra-foundations",
    title: "Linear Algebra Foundations",
    subject: "Mathematics",
    description:
      "Build geometric intuition for vectors, spans, and matrix transformations.",
    progress: 62,
    lessonsComplete: 13,
    lessonCount: 21,
    duration: "4 weeks",
    intensity: "3 sessions each week",
    weakness: "eigenvectors",
  },
  {
    id: "organic-chemistry-reactions",
    title: "Organic Chemistry Reactions",
    subject: "Chemistry",
    description:
      "Practice reaction families with pattern recall and mechanism checkpoints.",
    progress: 28,
    lessonsComplete: 6,
    lessonCount: 22,
    duration: "5 weeks",
    intensity: "4 sessions each week",
    weakness: "nucleophilic substitution",
  },
  {
    id: "world-history-systems",
    title: "World History Systems",
    subject: "Humanities",
    description:
      "Connect empires, trade routes, and social shifts across eras.",
    progress: 81,
    lessonsComplete: 17,
    lessonCount: 20,
    duration: "3 weeks",
    intensity: "2 sessions each week",
    weakness: "economic causality",
  },
]

export const dashboardData = {
  userName: "Jake",
  streakDays: 12,
  continueCourseId: "linear-algebra-foundations",
  insightTopic: "eigenvectors",
  continueCopy:
    "You were one step away from locking in the geometric meaning of eigenvectors. Pick up at Lesson 14.",
}

export const courseDetailsById: Record<string, CourseDetailData> = {
  "linear-algebra-foundations": {
    ...courseCatalog[0],
    level: "Intermediate",
    streak: 12,
    hoursInvested: 18,
    materials: [
      {
        label: "Lecture notes",
        type: "PDF",
        detail: "14 pages annotated and chunked into concepts",
      },
      {
        label: "Problem set",
        type: "Worksheet",
        detail: "20 mixed prompts from your last study block",
      },
      {
        label: "Reference deck",
        type: "Slides",
        detail: "Visual recap for transformations and bases",
      },
    ],
    learningPath: [
      {
        id: "vectors-and-bases",
        title: "Vectors and Bases",
        description:
          "Refresh the structure before moving into transformations.",
        completion: 100,
        lessons: [
          {
            id: "vector-geometry",
            title: "Vector geometry",
            summary: "See vectors as direction, length, and relationship.",
            state: "complete",
            xp: 40,
            duration: "12 min",
          },
          {
            id: "basis-change",
            title: "Changing basis",
            summary: "Translate coordinates between viewpoints.",
            state: "complete",
            xp: 55,
            duration: "15 min",
          },
        ],
      },
      {
        id: "transformations",
        title: "Transformations",
        description:
          "Map matrices to motion so each operation feels concrete.",
        completion: 68,
        lessons: [
          {
            id: "matrix-motion",
            title: "Matrices as motion",
            summary: "Connect a matrix to stretching, rotating, and shearing.",
            state: "complete",
            xp: 60,
            duration: "18 min",
          },
          {
            id: "eigenvector-intuition",
            title: "Eigenvector intuition",
            summary: "Identify the directions a transformation preserves.",
            state: "current",
            xp: 80,
            duration: "20 min",
          },
          {
            id: "diagonalization-preview",
            title: "Diagonalization preview",
            summary: "Use structure to simplify repeated transforms.",
            state: "locked",
            xp: 95,
            duration: "24 min",
          },
        ],
      },
      {
        id: "applications",
        title: "Applications",
        description: "Move from theory into systems and signal thinking.",
        completion: 0,
        lessons: [
          {
            id: "stability-systems",
            title: "Stability in systems",
            summary: "Read long-term behavior from eigen information.",
            state: "locked",
            xp: 110,
            duration: "22 min",
          },
          {
            id: "data-compression",
            title: "Compression patterns",
            summary: "See how basis choice supports representation.",
            state: "locked",
            xp: 120,
            duration: "26 min",
          },
        ],
      },
    ],
  },
}

export const exerciseById: Record<string, ExerciseData> = {
  "linear-algebra-foundations:eigenvector-intuition": {
    courseId: "linear-algebra-foundations",
    lessonId: "eigenvector-intuition",
    title: "Eigenvector intuition",
    prompt:
      "A transformation stretches the x-axis by 2 and leaves the y-axis unchanged. Which direction is an eigenvector for that transformation?",
    step: 3,
    stepCount: 6,
    xp: 80,
    hint:
      "Look for a direction that keeps pointing the same way after the transformation.",
    options: [
      {
        id: "a",
        label: "Option A",
        body: "Any vector on the x-axis",
      },
      {
        id: "b",
        label: "Option B",
        body: "Only vectors at 45 degrees",
      },
      {
        id: "c",
        label: "Option C",
        body: "Any vector that changes length and direction",
      },
      {
        id: "d",
        label: "Option D",
        body: "Only the zero vector",
      },
    ],
  },
}

export const createModes = [
  {
    id: "upload",
    title: "Upload document",
    description:
      "Turn notes, slides, or a reading pack into a guided course.",
  },
  {
    id: "topic",
    title: "Generate from topic",
    description:
      "Start from a concept and let Tuto scaffold the sequence.",
  },
]

export function getCourseDetail(courseId: string) {
  return (
    courseDetailsById[courseId] ??
    courseDetailsById["linear-algebra-foundations"]
  )
}

export function getExercise(courseId: string, lessonId: string) {
  return (
    exerciseById[`${courseId}:${lessonId}`] ??
    exerciseById["linear-algebra-foundations:eigenvector-intuition"]
  )
}
