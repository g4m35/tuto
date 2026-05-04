"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  Flag,
  Layers3,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  MessageSquareText,
  MousePointer2,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { ExerciseData, ExerciseOption, LessonInteractiveData, LessonStepData } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface LessonExerciseClientProps {
  courseId: string
  lessonId: string
  initialExercise: ExerciseData | null
}

interface CheckResult {
  isCorrect: boolean
  selectedOptionId?: string
  correctOptionId: string
  correctOptionBody: string
  selectedFeedback?: string | null
  explanation: string
  canContinue: boolean
  nextLessonId: string | null
  courseComplete: boolean
}

const stepIconByKind = {
  hook: Sparkles,
  concept: BookOpen,
  example: Layers3,
  interactive: MousePointer2,
  practice: Lightbulb,
  reflection: MessageSquareText,
  checkpoint: Target,
} satisfies Record<LessonStepData["kind"], typeof Sparkles>

function fallbackSteps(exercise: ExerciseData): LessonStepData[] {
  return [
    {
      id: `${exercise.lessonId}-concept`,
      kind: "concept",
      title: exercise.title,
      body: exercise.objective || "Build the idea first, then test it with one focused checkpoint.",
      takeaway: exercise.hint,
    },
    {
      id: `${exercise.lessonId}-checkpoint`,
      kind: "checkpoint",
      title: "Checkpoint",
      body: "Choose the answer that best fits the lesson.",
      prompt: exercise.prompt,
      options: exercise.options,
      correctOptionId: exercise.correctOptionId,
      explanation: exercise.explanation,
    },
  ]
}

function stepLabel(kind: LessonStepData["kind"]) {
  switch (kind) {
    case "hook":
      return "Start"
    case "concept":
      return "Concept"
    case "example":
      return "Example"
    case "interactive":
      return "Interactive"
    case "practice":
      return "Practice"
    case "reflection":
      return "Reflect"
    case "checkpoint":
      return "Checkpoint"
  }
}

function displayStepTitle(step: LessonStepData) {
  switch (step.title) {
    case "Start with the puzzle":
      return "Why this matters"
    case "Build the model":
      return "Core idea"
    case "Work a small example":
      return "See it in action"
    case "Test the moving parts":
      return "Compare the parts"
    case "Try it before the checkpoint":
      return "Try the question"
    case "Checkpoint":
      return "Check your understanding"
    default:
      return step.title
  }
}

function displayStepBody(step: LessonStepData, lessonTitle: string) {
  if (step.kind === "hook" && step.body.startsWith("Before naming the rule,")) {
    return `This lesson helps you use ${lessonTitle} instead of only recognizing the words. Read the idea, try it in a small case, then answer the checkpoint.`
  }

  return step.body
}

function hasTemplateLeak(value: string) {
  const lower = value.toLowerCase()
  return [
    "before naming the rule",
    "lesson idea",
    "a lesson should earn",
    "invisible mechanism visible",
    "name the moving parts",
    "which answer wins",
    "hard situation easier to reason",
  ].some((phrase) => lower.includes(phrase))
}

function isLegacyTemplateExercise(exercise: ExerciseData | null) {
  if (!exercise) return false
  const steps = exercise.steps ?? []
  const problemSteps = steps.filter(
    (step) => step.prompt && (step.options?.length ?? 0) >= 2 && step.correctOptionId,
  )
  const visibleText = [
    exercise.objective,
    exercise.title,
    ...steps.flatMap((step) => [
      step.title,
      step.body,
      step.takeaway,
      step.prompt,
      step.hint,
    ]),
  ]
    .filter(Boolean)
    .join("\n")

  return (
    hasTemplateLeak(visibleText) ||
    steps.length < 8 ||
    problemSteps.length < 6 ||
    steps.some((step) => step.body.trim().length > 520)
  )
}

export function LessonExerciseClient({
  courseId,
  lessonId,
  initialExercise,
}: LessonExerciseClientProps) {
  const router = useRouter()
  const initialExerciseIsLegacy = isLegacyTemplateExercise(initialExercise)
  const [exercise, setExercise] = useState<ExerciseData | null>(
    initialExerciseIsLegacy ? null : initialExercise,
  )
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [stepResults, setStepResults] = useState<Record<string, CheckResult>>({})
  const [showHint, setShowHint] = useState(false)
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(!initialExercise || initialExerciseIsLegacy)
  const [error, setError] = useState<string | null>(null)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [revealedCards, setRevealedCards] = useState<Set<string>>(() => new Set())
  const [sliderValue, setSliderValue] = useState(50)

  useEffect(() => {
    if (exercise) return

    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/courses/${courseId}/exercises`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lessonId }),
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.error || "Failed to generate exercise.")
        }

        if (!cancelled) {
          setExercise(data?.exercise ?? null)
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Failed to generate exercise.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [courseId, exercise, lessonId])

  useEffect(() => {
    setActiveStepIndex(0)
    setSelectedOptions({})
    setStepResults({})
    setShowHint(false)
    setRevealedCards(new Set())
    setSliderValue(50)
  }, [exercise?.lessonId])

  const steps = useMemo(() => (exercise ? exercise.steps?.length ? exercise.steps : fallbackSteps(exercise) : []), [exercise])
  const activeStep = steps[activeStepIndex]
  const activeIsCheckpoint = activeStep?.kind === "checkpoint"
  const progress = steps.length ? Math.round(((activeStepIndex + 1) / steps.length) * 100) : 0
  const activeOptions = activeStep?.options?.length
    ? activeStep.options
    : activeIsCheckpoint
      ? exercise?.options ?? []
      : []
  const selectedOption = activeStep ? selectedOptions[activeStep.id] ?? null : null
  const checkResult = activeStep ? stepResults[activeStep.id] ?? null : null
  const checked = Boolean(checkResult)
  const activeHasQuestion = Boolean(activeStep?.prompt && activeOptions.length >= 2)

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[linear-gradient(180deg,#ffffff_0%,#fbfff8_56%,#edf8f2_100%)] text-[var(--text)]">
        <header className="flex h-16 shrink-0 items-center border-b border-[var(--border)] bg-white/92 px-4 sm:px-6">
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-[var(--text-dim)] hover:bg-[var(--bg-elev-2)] hover:text-[var(--text)]"
          >
            <ChevronLeft className="size-4" />
            Exit
          </Link>
        </header>
        <main className="grid min-h-0 flex-1 place-items-center px-4 py-10">
          <section className="w-full max-w-[720px] rounded-[var(--radius)] border border-[var(--border)] bg-white px-7 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:px-8">
            <p className="eyebrow">Building levels</p>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[44px]">
              Preparing a problem-first lesson.
            </h1>
            <div className="mt-6 flex items-center gap-3 text-sm text-[var(--text-dim)]">
            <LoaderCircle className="size-5 animate-spin text-[var(--text)]" />
              Creating short checks, feedback, and one final checkpoint.
            </div>
          </section>
        </main>
      </div>
    )
  }

  if (!exercise || !activeStep) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[linear-gradient(180deg,#ffffff_0%,#fbfff8_56%,#edf8f2_100%)] text-[var(--text)]">
        <header className="flex h-16 shrink-0 items-center border-b border-[var(--border)] bg-white/92 px-4 sm:px-6">
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-[var(--text-dim)] hover:bg-[var(--bg-elev-2)] hover:text-[var(--text)]"
          >
            <ChevronLeft className="size-4" />
            Exit
          </Link>
        </header>
        <main className="grid min-h-0 flex-1 place-items-center px-4 py-10">
          <section className="w-full max-w-[720px] rounded-[var(--radius)] border border-[var(--border)] bg-white px-7 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:px-8">
            <p className="eyebrow">Lesson unavailable</p>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[44px]">
              We could not generate this lesson yet.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
              {error || "The lesson service returned no content."}
            </p>
            <div className="mt-6">
              <Button onClick={() => window.location.reload()}>Try again</Button>
            </div>
          </section>
        </main>
      </div>
    )
  }

  async function checkAnswer() {
    if (!activeStep || !selectedOption) return

    if (!activeIsCheckpoint) {
      const selected = activeOptions.find((option) => option.id === selectedOption)
      const correct = activeOptions.find((option) => option.id === activeStep.correctOptionId)

      if (!selected || !correct) return

      const result: CheckResult = {
        isCorrect: selected.id === correct.id,
        selectedOptionId: selected.id,
        correctOptionId: correct.id,
        correctOptionBody: correct.body,
        selectedFeedback: selected.feedback ?? null,
        explanation:
          (selected.id === correct.id ? correct.feedback : selected.feedback) ??
          activeStep.explanation ??
          activeStep.hint ??
          "Use the feedback, then continue to the next case.",
        canContinue: true,
        nextLessonId: null,
        courseComplete: false,
      }

      setStepResults((current) => ({ ...current, [activeStep.id]: result }))
      return
    }

    setChecking(true)
    setError(null)

    try {
      const response = await fetch(`/api/courses/${courseId}/exercises/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId,
          selectedOptionId: selectedOption,
          stepId: activeStep.id,
        }),
      })
      const data = (await response.json().catch(() => null)) as CheckResult & { error?: string } | null

      if (!response.ok || !data) {
        throw new Error(data?.error || "Unable to check this answer.")
      }

      setStepResults((current) => ({ ...current, [activeStep.id]: data }))
      router.refresh()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to check this answer.")
    } finally {
      setChecking(false)
    }
  }

  function continueAfterCheck() {
    if (!checkResult?.canContinue) return

    if (checkResult.nextLessonId) {
      router.push(`/courses/${courseId}/lesson/${checkResult.nextLessonId}`)
      return
    }

    router.push(`/courses/${courseId}`)
  }

  function goNext() {
    if (activeHasQuestion && !checkResult) {
      void checkAnswer()
      return
    }

    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex((value) => value + 1)
      setShowHint(false)
      return
    }

    if (checkResult?.canContinue) {
      continueAfterCheck()
      return
    }

    void checkAnswer()
  }

  function selectOption(optionId: string) {
    if (!activeStep) return

    setSelectedOptions((current) => ({ ...current, [activeStep.id]: optionId }))
    setStepResults((current) => {
      const next = { ...current }
      delete next[activeStep.id]
      return next
    })
  }

  function toggleCard(cardId: string) {
    setRevealedCards((current) => {
      const next = new Set(current)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  const isLastStep = activeStepIndex === steps.length - 1
  const primaryDisabled = (activeHasQuestion && !checkResult && !selectedOption) || checking
  const primaryLabel = checking
    ? "Checking"
    : activeHasQuestion && !checkResult
      ? "Check"
      : isLastStep
        ? checkResult?.canContinue
          ? checkResult.courseComplete
            ? "Finish course"
            : "Next lesson"
          : "Try again"
        : "Continue"

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[linear-gradient(180deg,#ffffff_0%,#fbfff8_56%,#edf8f2_100%)] text-[var(--text)]">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[var(--border)] bg-white/92 px-4 backdrop-blur sm:px-6">
        <Link
          href={`/courses/${exercise.courseId}`}
          className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-[var(--text-dim)] hover:bg-[var(--bg-elev-2)] hover:text-[var(--text)]"
        >
          <ChevronLeft className="size-4" />
          Exit
        </Link>
        <div className="min-w-0 flex-1">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <span className="hidden truncate text-sm text-[var(--text-dim)] sm:block">
              {exercise.title}
            </span>
            <div className="h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[var(--bg-soft)]">
              <motion.div
                className="h-full rounded-full bg-[var(--accent-strong)]"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
              />
            </div>
            <span className="whitespace-nowrap text-sm tabular-nums text-[var(--text-dim)]">
              {activeStepIndex + 1}/{steps.length}
            </span>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm text-[var(--text-dim)] sm:inline-flex">
          <Sparkles className="size-4 text-[var(--text)]" />
          {exercise.xp} XP
        </div>
        <button
          type="button"
          aria-label="Report problem"
          className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-dim)] hover:text-[var(--text)]"
        >
          <Flag className="size-4" />
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <motion.section
          key={activeStep.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
          className="mx-auto grid w-full max-w-[860px] gap-5"
        >
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.14em] text-[var(--text-faint)]">
            <span>Level {activeStepIndex + 1}</span>
            <span>{stepLabel(activeStep.kind)}</span>
          </div>

          <LessonSketch step={activeStep} index={activeStepIndex} total={steps.length} checked={checked} />

          <div className="space-y-3">
            <h1 className="text-[34px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[44px]">
              {displayStepTitle(activeStep)}
            </h1>
            <p className="text-[18px] leading-8 text-[var(--text-dim)]">
              {displayStepBody(activeStep, exercise.title)}
            </p>
          </div>

          {activeStep.interactive ? (
            <InteractiveLessonPanel
              interactive={activeStep.interactive}
              revealedCards={revealedCards}
              sliderValue={sliderValue}
              onToggleCard={toggleCard}
              onSliderChange={setSliderValue}
            />
          ) : null}

          {activeStep.prompt ? (
            <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:px-6">
              <p className="text-[22px] font-semibold leading-8 tracking-normal text-[var(--text)]">
                {activeStep.prompt}
              </p>
            </section>
          ) : null}

          {activeHasQuestion ? (
            <ProblemOptions
              options={activeOptions}
              selectedOption={selectedOption}
              checkResult={checkResult}
              onSelect={selectOption}
            />
          ) : null}

          {showHint ? (
            <div className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-elev-2)] px-5 py-4 text-sm leading-7 text-[var(--text-dim)]">
              {activeStep.hint || exercise.hint}
            </div>
          ) : null}

          {checkResult ? <FeedbackPanel result={checkResult} /> : null}

          {error ? (
            <div className="rounded-[var(--radius-sm)] border border-red-300/60 bg-red-50 px-5 py-4 text-sm leading-7 text-red-700">
              {error}
            </div>
          ) : null}
        </motion.section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--border)] bg-white/94 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setActiveStepIndex((value) => Math.max(0, value - 1))
                setShowHint(false)
              }}
              disabled={activeStepIndex === 0}
            >
              <ChevronLeft data-icon="inline-start" />
              Back
            </Button>
            <Button variant="ghost" onClick={() => setShowHint((value) => !value)}>
              <Lightbulb data-icon="inline-start" />
              {showHint ? "Hide hint" : "Hint"}
            </Button>
          </div>

          <Button
            onClick={goNext}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                goNext()
              }
            }}
            disabled={primaryDisabled}
          >
            {checking ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {primaryLabel}
            {!checking ? <ArrowRight data-icon="inline-end" /> : null}
          </Button>
        </div>
      </footer>
    </div>
  )
}

function LessonSketch({
  step,
  index,
  total,
  checked,
}: {
  step: LessonStepData
  index: number
  total: number
  checked: boolean
}) {
  const Icon = stepIconByKind[step.kind]
  const left = Math.max(0, Math.min(100, total > 1 ? (index / (total - 1)) * 100 : 0))

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <div className="relative h-[150px] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f4faef_100%)]">
        <div className="absolute inset-x-8 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--bg-soft)]" />
        <motion.div
          className="absolute left-8 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--accent-strong)]"
          initial={false}
          animate={{ width: `${left * 0.76}%` }}
          transition={{ duration: 0.2 }}
        />
        {[0, 0.5, 1].map((position, nodeIndex) => {
          const complete = index / Math.max(total - 1, 1) >= position

          return (
            <div
              key={position}
              className={cn(
                "absolute top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)]",
                complete ? "border-[var(--accent-strong)] text-[var(--text)]" : "border-[var(--border)] text-[var(--text-faint)]",
              )}
              style={{ left: `${12 + position * 76}%` }}
            >
              {nodeIndex === 1 ? <Icon className="size-5" /> : complete ? <Check className="size-5" /> : <Target className="size-5" />}
            </div>
          )
        })}
        <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[var(--text-faint)]">
          <span>Guess</span>
          <span>{checked ? "Feedback" : "Choose"}</span>
          <span>Transfer</span>
        </div>
      </div>
    </div>
  )
}

function ProblemOptions({
  options,
  selectedOption,
  checkResult,
  onSelect,
}: {
  options: ExerciseOption[]
  selectedOption: string | null
  checkResult: CheckResult | null
  onSelect: (optionId: string) => void
}) {
  return (
    <div className="grid gap-3">
      {options.map((option, index) => {
        const selected = selectedOption === option.id
        const correct = checkResult?.correctOptionId === option.id
        const incorrectSelection = selected && checkResult && !checkResult.isCorrect

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.id)}
            className={cn(
              "group w-full rounded-[var(--radius-sm)] border bg-white px-4 py-4 text-left shadow-[0_12px_34px_rgba(15,23,42,0.05)] transition sm:px-5",
              selected && !checkResult && "border-[var(--border-strong)] bg-[var(--bg-elev-2)]",
              correct && "border-emerald-300 bg-emerald-50",
              incorrectSelection && "border-red-300 bg-red-50",
              !selected && !correct && "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]",
            )}
          >
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  selected || correct
                    ? "border-[var(--accent-strong)] bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-dim)]",
                )}
              >
                {option.label || String.fromCharCode(65 + index)}
              </span>
              <span className="text-base leading-7 text-[var(--text)]">{option.body}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function FeedbackPanel({ result }: { result: CheckResult }) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-[var(--radius)] border px-5 py-4 text-sm leading-7 shadow-[0_16px_42px_rgba(15,23,42,0.06)]",
        result.isCorrect
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-red-300 bg-red-50 text-red-900",
      )}
    >
      <div className="flex items-start gap-3">
        {result.isCorrect ? <Check className="mt-1 size-5" /> : <X className="mt-1 size-5" />}
        <div>
          <p className="font-semibold">{result.isCorrect ? "Correct" : "Not quite"}</p>
          {!result.isCorrect ? (
            <p className="mt-1">
              Correct answer: <span className="font-medium">{result.correctOptionBody}</span>
            </p>
          ) : null}
          <p className="mt-2">{result.explanation}</p>
        </div>
      </div>
    </div>
  )
}

function InteractiveLessonPanel({
  interactive,
  revealedCards,
  sliderValue,
  onToggleCard,
  onSliderChange,
}: {
  interactive: LessonInteractiveData
  revealedCards: Set<string>
  sliderValue: number
  onToggleCard: (cardId: string) => void
  onSliderChange: (value: number) => void
}) {
  const sliderIndex = Math.min(
    interactive.items.length - 1,
    Math.max(0, Math.round((sliderValue / 100) * Math.max(0, interactive.items.length - 1))),
  )
  const sliderItem = interactive.items[sliderIndex]
  const isSlider = interactive.kind === "slider"
  const isSort = interactive.kind === "sort"
  const isMatch = interactive.kind === "match"
  const Icon = isSlider ? SlidersHorizontal : isSort ? ListChecks : MousePointer2

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev-2)] p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-sm text-[var(--text-dim)]">
        <Icon className="size-4 text-[var(--text)]" />
        {interactive.prompt}
      </div>

      {isSlider ? (
        <div className="space-y-5">
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
              <span>{interactive.minLabel || "Low"}</span>
              <span>{interactive.maxLabel || "High"}</span>
            </div>
            <input
              aria-label="Interactive confidence slider"
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(event) => onSliderChange(Number(event.target.value))}
              className="mt-4 w-full accent-[var(--accent-strong)]"
            />
          </div>
          <motion.div
            key={sliderItem?.id ?? "slider-empty"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg)] px-5 py-4"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
              {sliderItem?.label || "Lens"}
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--text)]">
              {sliderItem?.body || "Move the slider to reveal a learning lens."}
            </p>
          </motion.div>
        </div>
      ) : (
        <div className={cn("grid gap-3", isSort ? "md:grid-cols-1" : "md:grid-cols-3")}>
          {interactive.items.map((item, index) => {
            const revealed = revealedCards.has(item.id)

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onToggleCard(item.id)}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-4 py-4 text-left",
                  isSort ? "min-h-[104px]" : "min-h-[170px]",
                  revealed
                    ? "border-[var(--border-strong)] bg-[var(--bg)]"
                    : "border-[var(--border)] bg-[var(--bg-elev)] hover:border-[var(--border-strong)]",
                )}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.16 }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
                    {isMatch && item.matchId ? `${item.label} / ${item.matchId}` : item.label}
                  </span>
                  <RotateCcw className={cn("size-4 text-[var(--text-faint)]", revealed && "rotate-180 text-[var(--text)]")} />
                </div>
                <p className={cn("mt-5 text-sm leading-7", revealed ? "text-[var(--text)]" : "text-[var(--text-dim)]")}>
                  {revealed
                    ? item.body
                    : isSort
                      ? "Reveal this step"
                      : isMatch
                        ? "Reveal the paired idea"
                        : "Reveal this lens"}
                </p>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
