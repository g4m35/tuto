"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ChevronLeft, Lightbulb, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { getExercise } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function LessonExercisePage() {
  const params = useParams<{ id: string; lessonId: string }>()
  const exercise = useMemo(
    () => getExercise(params.id, params.lessonId),
    [params.id, params.lessonId]
  )
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [checked, setChecked] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/courses/${exercise.courseId}`}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]"
        >
          <ChevronLeft className="size-4" />
          Close lesson
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2 text-sm text-[var(--text-dim)]">
          <Sparkles className="size-4 text-[var(--accent)]" />
          {exercise.xp} XP
        </div>
      </div>

      <section className="space-y-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elev)] p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {Array.from({ length: exercise.stepCount }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  "size-2.5 rounded-full border border-[var(--border)] bg-[var(--bg-soft)]",
                  index < exercise.step && "border-transparent bg-[var(--accent)]"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-[var(--text-dim)]">
            Step {exercise.step} of {exercise.stepCount}
          </p>
        </div>

        <div className="space-y-4">
          <p className="eyebrow">Exercise</p>
          <h1 className="serif text-4xl font-semibold tracking-tight text-[var(--text)]">
            {exercise.title}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--text-dim)]">
            {exercise.prompt}
          </p>
        </div>

        <div className="flex min-h-56 items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[color:color-mix(in_srgb,var(--bg-soft)_80%,var(--bg))] px-6 text-center text-sm text-[var(--text-dim)]">
          Visual workspace placeholder
        </div>

        <div className="grid gap-3">
          {exercise.options.map((option) => {
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
                  "rounded-[var(--radius-sm)] border p-4 text-left",
                  selected
                    ? "border-[color:color-mix(in_srgb,var(--accent)_30%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_8%,var(--bg-soft))]"
                    : "border-[var(--border)] bg-[var(--bg-soft)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]"
                )}
              >
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold text-[var(--text-dim)]">
                    {option.label.slice(-1)}
                  </span>
                  <div>
                    <p className="font-medium text-[var(--text)]">{option.body}</p>
                    {checked && selected ? (
                      <p className="mt-2 text-sm text-[var(--accent)]">
                        Locked in for checking.
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {showHint ? (
          <div className="rounded-[var(--radius-sm)] border border-[color:color-mix(in_srgb,var(--accent)_24%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--bg-soft))] p-4 text-sm leading-7 text-[var(--text-dim)]">
            {exercise.hint}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
          <Button
            variant="secondary"
            onClick={() => setShowHint((value) => !value)}
          >
            <Lightbulb data-icon="inline-start" />
            {showHint ? "Hide hint" : "Show hint"}
          </Button>
          <Button
            onClick={() => setChecked(true)}
            disabled={!selectedOption}
          >
            Check answer
          </Button>
        </div>
      </section>
    </div>
  )
}
