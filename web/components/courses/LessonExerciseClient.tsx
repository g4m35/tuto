"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowRight, ChevronLeft, Check, Lightbulb, LoaderCircle, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { ExerciseData } from "@/lib/mock-data"
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
            Preparing your practice step.
          </h1>
          <div className="mt-6 flex items-center gap-3 text-sm text-[var(--text-dim)]">
            <LoaderCircle className="size-5 animate-spin text-[var(--text)]" />
            Building one focused question from this lesson.
          </div>
        </section>
      </div>
    )
  }

  if (!exercise) {
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
          <p className="eyebrow">Exercise unavailable</p>
          <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)]">
            We could not generate this lesson yet.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
            {error || "The exercise service returned no content."}
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

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
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

      <section className="space-y-8">
        <div className="space-y-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow">Exercise</p>
              <div className="flex items-center gap-2">
                {Array.from({ length: exercise.stepCount }).map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "size-2 rounded-full border border-[var(--border)] bg-[var(--bg-soft)]",
                      index < exercise.step && "border-transparent bg-[var(--text)]"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[56px]">
                {exercise.title}
              </h1>
              <p className="max-w-3xl text-xl leading-8 text-[var(--text-dim)] italic">
                {exercise.prompt}
              </p>
              </div>
            </div>

          <div className="space-y-3">
            {exercise.options.map((option, index) => {
              const selected = selectedOption === option.id
              const correct = checked && checkResult?.correctOptionId === option.id
              const incorrectSelection = checked && selected && checkResult?.isCorrect === false

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedOption(option.id)
                    setChecked(false)
                    setCheckResult(null)
                  }}
                  className={cn(
                    "editorial-card interactive-card t-lift animate-rise-in w-full text-left px-5 py-5",
                    selected && "border-[var(--border-strong)] bg-[var(--bg-elev-2)]",
                    correct && "border-emerald-300/70 bg-emerald-300/10",
                    incorrectSelection && "border-red-300/70 bg-red-300/10",
                    !selected && !correct && "hover:border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]"
                  )}
                  style={{ animationDelay: `${index * 70}ms` }}
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
                    {checkResult.isCorrect
                      ? "Nice. This lesson is complete."
                      : <>The answer is <span className="text-[var(--text)]">{checkResult.correctOptionBody}</span>.</>}
                  </p>
                  <p className="mt-3">
                    {checkResult.explanation}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {showHint ? (
            <div className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-elev-2)] px-5 py-4 text-sm leading-7 text-[var(--text-dim)]">
              {exercise.hint}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[var(--radius-sm)] border border-red-300/60 bg-red-300/10 px-5 py-4 text-sm leading-7 text-red-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
            <Button variant="ghost" onClick={() => setShowHint((value) => !value)}>
              <Lightbulb data-icon="inline-start" />
              {showHint ? "Hide hint" : "Show hint"}
            </Button>
            <Button
              onClick={checkResult?.canContinue ? continueAfterCheck : checkAnswer}
              disabled={!selectedOption || checking}
            >
              {checking ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {checkResult?.canContinue
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
