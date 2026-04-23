"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, ChevronLeft, Lightbulb, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { ExerciseData } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface LessonExerciseClientProps {
  courseId: string
  lessonId: string
  initialExercise: ExerciseData | null
}

export function LessonExerciseClient({
  courseId,
  lessonId,
  initialExercise,
}: LessonExerciseClientProps) {
  const [exercise, setExercise] = useState<ExerciseData | null>(initialExercise)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [checked, setChecked] = useState(false)
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
          <h1 className="serif mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--text)]">
            Generating the next adaptive exercise.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
            Tuto is taking the current lesson, extracting the unstable idea, and turning it into a fresh practice step.
          </p>
        </section>
      </div>
    )
  }

  if (error || !exercise) {
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
          <h1 className="serif mt-4 text-5xl font-semibold tracking-[-0.05em] text-[var(--text)]">
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

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-8">
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

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
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
              <h1 className="serif max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-[var(--text)] sm:text-6xl">
                {exercise.title}
              </h1>
              <p className="max-w-3xl text-xl leading-8 text-[var(--text-dim)] italic">
                {exercise.prompt}
              </p>
            </div>
          </div>

          <div className="editorial-card flex min-h-72 items-center justify-center px-6 py-6 text-center text-sm text-[var(--text-dim)]">
            Visual workspace placeholder for the adaptive explanation layer.
          </div>

          <div className="space-y-3">
            {exercise.options.map((option, index) => {
              const selected = selectedOption === option.id

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedOption(option.id)
                    setChecked(false)
                  }}
                  className={cn(
                    "editorial-card hover-lift animate-rise-in w-full text-left px-5 py-5",
                    selected
                      ? "border-[var(--border-strong)] bg-[var(--bg-elev-2)]"
                      : "hover:border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-[11px] font-medium text-[var(--text-dim)]">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div className="space-y-2">
                      <p className="text-base leading-7 text-[var(--text)]">{option.body}</p>
                      {checked && selected ? (
                        <p className="text-sm text-[var(--text-dim)]">Locked in for checking.</p>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {showHint ? (
            <div className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-elev-2)] px-5 py-4 text-sm leading-7 text-[var(--text-dim)]">
              {exercise.hint}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
            <Button variant="ghost" onClick={() => setShowHint((value) => !value)}>
              <Lightbulb data-icon="inline-start" />
              {showHint ? "Hide hint" : "Show hint"}
            </Button>
            <Button onClick={() => setChecked(true)} disabled={!selectedOption}>
              Check answer
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="editorial-card animate-rise-in-delay-1 p-5">
            <p className="eyebrow">Session</p>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-dim)]">
              <div className="flex items-center justify-between">
                <span>Step</span>
                <span className="text-[var(--text)]">
                  {exercise.step}/{exercise.stepCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Lesson id</span>
                <span className="text-[var(--text)]">{exercise.lessonId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Selection</span>
                <span className="text-[var(--text)]">
                  {selectedOption ? selectedOption.toUpperCase() : "Not answered"}
                </span>
              </div>
            </div>
          </div>

          <div className="editorial-card animate-rise-in-delay-2 p-5">
            <p className="eyebrow">Why this step</p>
            <p className="mt-4 text-sm leading-7 text-[var(--text-dim)]">
              The exercise is keeping the practice loop narrow, so you strengthen the current idea before the path opens wider.
            </p>
          </div>
        </aside>
      </section>
    </div>
  )
}
