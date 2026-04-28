"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, ChevronLeft, Check, Lightbulb, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { ExerciseData } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface LessonExerciseClientProps {
  courseId: string
  lessonId: string
  initialExercise: ExerciseData | null
}

function LessonVisualPanel() {
  return (
    <div className="editorial-card relative overflow-hidden px-6 py-6">
      <div className="absolute inset-x-6 top-4 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[var(--text-faint)]">
        <span>Intuition layer</span>
        <span>same vector · new frame</span>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-6">
          <svg viewBox="-120 -120 240 240" className="h-[18rem] w-[18rem]" aria-hidden="true">
            <defs>
              <pattern
                id="lesson-grid"
                width="22"
                height="22"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(28)"
              >
                <path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect x="-120" y="-120" width="240" height="240" fill="url(#lesson-grid)" />
            <line x1="-90" y1="0" x2="90" y2="0" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
            <line x1="0" y1="-90" x2="0" y2="90" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
            <line x1="0" y1="0" x2="70" y2="-42" stroke="currentColor" strokeWidth="3" className="text-[var(--accent)]" strokeLinecap="round" />
            <circle cx="70" cy="-42" r="4" fill="currentColor" className="text-[var(--accent)]" />
            <line x1="0" y1="0" x2="54" y2="34" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
            <line x1="0" y1="0" x2="-34" y2="72" stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="space-y-4">
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4">
            <p className="eyebrow">What stays fixed</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-dim)]">
              The object itself does not move. Only the coordinates shift when the frame changes.
            </p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4">
            <p className="eyebrow">Watch for</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-dim)]">
              Eliminate answers that confuse a property of the basis with a property of the vector.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
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
  const selectedBody =
    exercise?.options.find((option) => option.id === selectedOption)?.body ?? null

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
              <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[56px]">
                {exercise.title}
              </h1>
              <p className="max-w-3xl text-xl leading-8 text-[var(--text-dim)] italic">
                {exercise.prompt}
              </p>
              </div>
            </div>

          <LessonVisualPanel />

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
                    "editorial-card interactive-card t-lift animate-rise-in w-full text-left px-5 py-5",
                    selected
                      ? "border-[var(--border-strong)] bg-[var(--bg-elev-2)]"
                      : "hover:border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]"
                  )}
                  style={{ animationDelay: `${index * 70}ms` }}
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

          {checked && selectedBody ? (
            <div className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-elev-2)] px-5 py-4 text-sm leading-7 text-[var(--text-dim)]">
              <div className="flex items-start gap-3">
                <Check className="mt-1 size-4 text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Answer recorded</p>
                  <p className="mt-1">
                    You picked <span className="text-[var(--text)]">{selectedBody}</span>. Use the hint if you want one last nudge before moving on.
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

          <div className="editorial-card animate-rise-in-delay-3 p-5">
            <p className="eyebrow">Next unlock</p>
            <p className="mt-4 text-sm leading-7 text-[var(--text-dim)]">
              Once this concept is stable, Tuto opens the next step instead of widening the scope too early.
            </p>
          </div>
        </aside>
      </section>
    </div>
  )
}
