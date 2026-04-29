"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
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
import type { ExerciseData, LessonInteractiveData, LessonStepData } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface LessonExerciseClientProps {
  courseId: string
  lessonId: string
  initialExercise: ExerciseData | null
}

interface CheckResult {
  isCorrect: boolean
  correctOptionId: string
  correctOptionBody: string
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
      return "Hook"
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

export function LessonExerciseClient({
  courseId,
  lessonId,
  initialExercise,
}: LessonExerciseClientProps) {
  const router = useRouter()
  const [exercise, setExercise] = useState<ExerciseData | null>(initialExercise)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [checked, setChecked] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(!initialExercise)
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
    setSelectedOption(null)
    setChecked(false)
    setCheckResult(null)
    setShowHint(false)
    setRevealedCards(new Set())
    setSliderValue(50)
  }, [exercise?.lessonId])

  const steps = useMemo(() => (exercise ? exercise.steps?.length ? exercise.steps : fallbackSteps(exercise) : []), [exercise])
  const activeStep = steps[activeStepIndex]
  const activeIsCheckpoint = activeStep?.kind === "checkpoint"
  const progress = steps.length ? Math.round(((activeStepIndex + 1) / steps.length) * 100) : 0

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-8">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]"
        >
          <ChevronLeft className="size-4" />
          Close lesson
        </Link>

        <section className="editorial-card animate-rise-in px-7 py-8 sm:px-8">
          <p className="eyebrow">Composing</p>
          <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)]">
            Preparing your interactive lesson.
          </h1>
          <div className="mt-6 flex items-center gap-3 text-sm text-[var(--text-dim)]">
            <LoaderCircle className="size-5 animate-spin text-[var(--text)]" />
            Building a guided path with practice and a checkpoint.
          </div>
        </section>
      </div>
    )
  }

  if (!exercise || !activeStep) {
    return (
      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-8">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]"
        >
          <ChevronLeft className="size-4" />
          Close lesson
        </Link>

        <section className="editorial-card animate-rise-in px-7 py-8 sm:px-8">
          <p className="eyebrow">Lesson unavailable</p>
          <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)]">
            We could not generate this lesson yet.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
            {error || "The lesson service returned no content."}
          </p>
          <div className="mt-6">
            <Button onClick={() => window.location.reload()}>Try again</Button>
          </div>
        </section>
      </div>
    )
  }

  async function checkAnswer() {
    if (!selectedOption) return

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
        }),
      })
      const data = (await response.json().catch(() => null)) as CheckResult & { error?: string } | null

      if (!response.ok || !data) {
        throw new Error(data?.error || "Unable to check this answer.")
      }

      setChecked(true)
      setCheckResult(data)
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
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex((value) => value + 1)
      return
    }

    if (checkResult?.canContinue) {
      continueAfterCheck()
      return
    }

    void checkAnswer()
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

  return (
    <div className="mx-auto flex w-full max-w-[1160px] flex-1 flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/courses/${exercise.courseId}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]"
        >
          <ChevronLeft className="size-4" />
          Close lesson
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2 text-sm text-[var(--text-dim)]">
          <Sparkles className="size-4 text-[var(--text)]" />
          {exercise.xp} XP
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="editorial-card h-fit overflow-hidden px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">Lesson path</p>
            <span className="text-xs text-[var(--text-dim)]">{progress}%</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
            <motion.div
              className="h-full rounded-full bg-[var(--text)]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            />
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            {steps.map((step, index) => {
              const Icon = stepIconByKind[step.kind]
              const active = index === activeStepIndex
              const complete = index < activeStepIndex || (index === activeStepIndex && checked)

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepIndex(index)}
                  className={cn(
                    "group flex w-[174px] shrink-0 items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-3 text-left transition lg:w-full",
                    active
                      ? "border-[var(--border-strong)] bg-[var(--bg-elev-2)] text-[var(--text)]"
                      : "border-transparent text-[var(--text-dim)] hover:border-[var(--border)] hover:bg-[var(--bg-elev-2)]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)]",
                      active && "border-[var(--border-strong)] bg-[var(--text)] text-[var(--accent-ink)]",
                      complete && !active && "border-[var(--border-strong)] text-[var(--text)]",
                    )}
                  >
                    {complete && !active ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                      {stepLabel(step.kind)}
                    </span>
                    <span className="mt-1 block truncate text-sm">{step.title}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
              <span>{exercise.subtitle || "Interactive lesson"}</span>
              <span className="size-1 rounded-full bg-[var(--text-faint)]" />
              <span>{activeStepIndex + 1}/{steps.length}</span>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[56px]">
                {exercise.title}
              </h1>
              {exercise.objective ? (
                <p className="max-w-3xl text-lg leading-8 text-[var(--text-dim)]">
                  {exercise.objective}
                </p>
              ) : null}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.article
              key={activeStep.id}
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
              className="editorial-card overflow-hidden"
            >
              <div className="border-b border-[var(--border)] px-5 py-4 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
                    {(() => {
                      const Icon = stepIconByKind[activeStep.kind]
                      return <Icon className="size-4 text-[var(--text)]" />
                    })()}
                    {stepLabel(activeStep.kind)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {steps.map((step, index) => (
                      <button
                        key={step.id}
                        type="button"
                        aria-label={`Go to step ${index + 1}`}
                        onClick={() => setActiveStepIndex(index)}
                        className={cn(
                          "size-2.5 rounded-full border border-[var(--border)] bg-[var(--bg-soft)]",
                          index <= activeStepIndex && "border-transparent bg-[var(--text)]",
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 py-6 sm:px-7 sm:py-8">
                <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="min-w-0 space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-[32px] font-semibold leading-[1.08] tracking-normal text-[var(--text)] sm:text-[42px]">
                        {activeStep.title}
                      </h2>
                      <p className="max-w-3xl text-lg leading-8 text-[var(--text-dim)]">
                        {activeStep.body}
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

                    {activeStep.prompt && !activeIsCheckpoint ? (
                      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev-2)] px-5 py-4">
                        <p className="text-sm uppercase tracking-[0.16em] text-[var(--text-faint)]">Try this</p>
                        <p className="mt-3 text-base leading-7 text-[var(--text)]">{activeStep.prompt}</p>
                      </div>
                    ) : null}

                    {activeIsCheckpoint ? (
                      <CheckpointPanel
                        step={activeStep}
                        exercise={exercise}
                        selectedOption={selectedOption}
                        checked={checked}
                        checkResult={checkResult}
                        onSelect={(optionId) => {
                          setSelectedOption(optionId)
                          setChecked(false)
                          setCheckResult(null)
                        }}
                      />
                    ) : null}

                    {activeStep.takeaway ? (
                      <div className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-elev-2)] px-5 py-4 text-sm leading-7 text-[var(--text-dim)]">
                        <div className="flex items-start gap-3">
                          <CircleDot className="mt-1 size-4 text-[var(--text)]" />
                          <p>{activeStep.takeaway}</p>
                        </div>
                      </div>
                    ) : null}

                    {showHint ? (
                      <div className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-elev-2)] px-5 py-4 text-sm leading-7 text-[var(--text-dim)]">
                        {activeStep.hint || exercise.hint}
                      </div>
                    ) : null}

                    {error ? (
                      <div className="rounded-[var(--radius-sm)] border border-red-300/60 bg-red-300/10 px-5 py-4 text-sm leading-7 text-red-100">
                        {error}
                      </div>
                    ) : null}
                  </div>

                  <div className="hidden xl:block">
                    <div className="sticky top-24 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">Focus</p>
                      <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                        Move one step at a time. Interact before the checkpoint, then use the result to decide whether this concept is ready to advance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setActiveStepIndex((value) => Math.max(0, value - 1))}
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
              disabled={(activeIsCheckpoint && !checkResult?.canContinue && !selectedOption) || checking}
            >
              {checking ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {activeStepIndex < steps.length - 1
                ? "Next step"
                : checkResult?.canContinue
                  ? checkResult.courseComplete
                    ? "Finish course"
                    : "Next lesson"
                  : checking
                    ? "Checking"
                    : "Check answer"}
              {!checking ? <ArrowRight data-icon="inline-end" /> : null}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function CheckpointPanel({
  step,
  exercise,
  selectedOption,
  checked,
  checkResult,
  onSelect,
}: {
  step: LessonStepData
  exercise: ExerciseData
  selectedOption: string | null
  checked: boolean
  checkResult: CheckResult | null
  onSelect: (optionId: string) => void
}) {
  const options = step.options?.length ? step.options : exercise.options
  const prompt = step.prompt || exercise.prompt

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev-2)] px-5 py-5">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">Question</p>
        <p className="mt-3 text-lg leading-8 text-[var(--text)]">{prompt}</p>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => {
          const selected = selectedOption === option.id
          const correct = checked && checkResult?.correctOptionId === option.id
          const incorrectSelection = checked && selected && checkResult?.isCorrect === false

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "editorial-card interactive-card t-lift w-full px-5 py-5 text-left",
                selected && "border-[var(--border-strong)] bg-[var(--bg-elev-2)]",
                correct && "border-emerald-300/70 bg-emerald-300/10",
                incorrectSelection && "border-red-300/70 bg-red-300/10",
                !selected && !correct && "hover:border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]",
              )}
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-[11px] font-medium text-[var(--text-dim)]">
                  {String.fromCharCode(65 + index)}
                </span>
                <div className="space-y-2">
                  <p className="text-base leading-7 text-[var(--text)]">{option.body}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {checked && checkResult ? (
        <div className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-elev-2)] px-5 py-4 text-sm leading-7 text-[var(--text-dim)]">
          <div className="flex items-start gap-3">
            {checkResult.isCorrect ? (
              <Check className="mt-1 size-4 text-emerald-200" />
            ) : (
              <X className="mt-1 size-4 text-red-200" />
            )}
            <div>
              <p className="text-sm font-medium text-[var(--text)]">
                {checkResult.isCorrect ? "Correct" : "Not quite"}
              </p>
              <p className="mt-1">
                {checkResult.isCorrect ? (
                  "Nice. This lesson is complete."
                ) : (
                  <>
                    The answer is <span className="text-[var(--text)]">{checkResult.correctOptionBody}</span>.
                  </>
                )}
              </p>
              <p className="mt-3">{checkResult.explanation}</p>
            </div>
          </div>
        </div>
      ) : null}
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
              className="mt-4 w-full accent-[var(--text)]"
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
