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
    id: "linear-algebra-for-ml",
    title: "Linear algebra for ML",
    subject: "Mathematics",
    description:
      "The intuition layer — spaces, maps, and why change-of-basis is just a point of view.",
    progress: 62,
    lessonsComplete: 8,
    lessonCount: 12,
    duration: "14 min",
    intensity: "45% mastered",
    weakness: "Change of basis",
  },
  {
    id: "thermodynamics-carefully",
    title: "Thermodynamics, carefully.",
    subject: "Physics",
    description:
      "Laws you can feel — heat, entropy, and the weird privacy of the second law.",
    progress: 41,
    lessonsComplete: 5,
    lessonCount: 14,
    duration: "22 min",
    intensity: "30% mastered",
    weakness: "Entropy as missing information",
  },
  {
    id: "monetary-policy",
    title: "Monetary policy",
    subject: "Economics",
    description:
      "How central banks steer — rates, reserves, and the Taylor rule in practice.",
    progress: 18,
    lessonsComplete: 2,
    lessonCount: 11,
    duration: "18 min",
    intensity: "12% mastered",
    weakness: "Taylor rule in practice",
  },
]

export const dashboardData = {
  userName: "Nava",
  streakDays: 12,
  continueCourseId: "linear-algebra-for-ml",
  insightTopic: "change of basis",
  continueCopy:
    "You were one step away from locking in why coordinates change while the underlying map stays the same.",
}

export const courseDetailsById: Record<string, CourseDetailData> = {
  "linear-algebra-for-ml": {
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
            id: "change-of-basis",
            title: "Change of basis",
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
            id: "coordinate-views",
            title: "Coordinate views",
            summary: "Separate the object from the numbers used to describe it.",
            state: "current",
            xp: 80,
            duration: "20 min",
          },
          {
            id: "basis-in-ml",
            title: "Basis in ML",
            summary: "Use representation changes to make models easier to read.",
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
  "thermodynamics-carefully": {
    ...courseCatalog[1],
    level: "Intermediate",
    streak: 6,
    hoursInvested: 10,
    materials: [
      {
        label: "Lecture spine",
        type: "Notes",
        detail: "A compact path through state variables, entropy, and useful work",
      },
    ],
    learningPath: [
      {
        id: "heat-and-work",
        title: "Heat and Work",
        description: "Build an embodied feel for energy transfer.",
        completion: 60,
        lessons: [
          {
            id: "state-variables",
            title: "State variables",
            summary: "Track what belongs to the system rather than the path.",
            state: "complete",
            xp: 50,
            duration: "16 min",
          },
          {
            id: "entropy-as-information",
            title: "Entropy as information",
            summary: "Connect missing information to macroscopic direction.",
            state: "current",
            xp: 70,
            duration: "22 min",
          },
        ],
      },
    ],
  },
  "monetary-policy": {
    ...courseCatalog[2],
    level: "Beginner",
    streak: 3,
    hoursInvested: 4,
    materials: [
      {
        label: "Policy brief",
        type: "Article",
        detail: "Rates, reserves, inflation targeting, and policy reaction functions",
      },
    ],
    learningPath: [
      {
        id: "central-bank-tools",
        title: "Central Bank Tools",
        description: "Read policy through a small set of levers.",
        completion: 25,
        lessons: [
          {
            id: "rate-channel",
            title: "The rate channel",
            summary: "See how short-term rates ripple through credit.",
            state: "complete",
            xp: 40,
            duration: "14 min",
          },
          {
            id: "taylor-rule",
            title: "Taylor rule in practice",
            summary: "Use inflation and output gaps to read a policy stance.",
            state: "current",
            xp: 65,
            duration: "18 min",
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
