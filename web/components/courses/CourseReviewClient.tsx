"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Check, ChevronLeft, RotateCcw, Target, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

export interface ReviewPrompt {
  id: string
  title: string
  summary: string
  unitTitle: string
}

interface CourseReviewClientProps {
  courseId: string
  courseTitle: string
  prompts: ReviewPrompt[]
}

function buildOptions(prompt: ReviewPrompt) {
  return [
    {
      id: "mechanism",
      label: "Mechanism",
      body: `Explain the working idea behind ${prompt.title}, then name where it applies.`,
    },
    {
      id: "definition",
      label: "Definition",
      body: `Repeat the title "${prompt.title}" and move on without testing it.`,
    },
    {
      id: "shortcut",
      label: "Shortcut",
      body: "Pick the fastest-looking rule even if the situation has changed.",
    },
  ]
}

export function CourseReviewClient({ courseId, courseTitle, prompts }: CourseReviewClientProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)

  const activePrompt = prompts[activeIndex]
  const options = useMemo(() => (activePrompt ? buildOptions(activePrompt) : []), [activePrompt])
  const progress = prompts.length ? Math.round((answeredIds.size / prompts.length) * 100) : 0
  const complete = prompts.length > 0 && answeredIds.size === prompts.length

  async function check() {
    if (!activePrompt || !selected) return

    const isCorrect = selected === "mechanism"
    setChecked(true)
    setError(null)
    setAnsweredIds((current) => {
      const next = new Set(current)
      next.add(activePrompt.id)
      return next
    })
    if (isCorrect && !answeredIds.has(activePrompt.id)) {
      setCorrectCount((count) => count + 1)
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowKind: "review",
          lessonId: activePrompt.id,
          selectedOptionId: selected,
          isCorrect,
          metadata: {
            promptTitle: activePrompt.title,
            unitTitle: activePrompt.unitTitle,
          },
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Unable to save review attempt.")
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save review attempt.")
    }
  }

  function next() {
    setSelected(null)
    setChecked(false)
    setActiveIndex((index) => Math.min(prompts.length - 1, index + 1))
  }

  function reset() {
    setActiveIndex(0)
    setSelected(null)
    setChecked(false)
    setCorrectCount(0)
    setAnsweredIds(new Set())
  }

  if (!activePrompt) {
    return (
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8">
        <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]">
          <ChevronLeft className="size-4" />
          Back to course
        </Link>
        <section className="editorial-card px-7 py-8">
          <p className="eyebrow">Review</p>
          <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)]">
            No review prompts yet.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
            Complete a lesson and this space will turn into spaced practice.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]">
          <ChevronLeft className="size-4" />
          Back to course
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2 text-sm text-[var(--text-dim)]">
          <Target className="size-4 text-[var(--text)]" />
          {correctCount}/{prompts.length}
        </div>
      </div>

      <section className="space-y-6">
        <div className="space-y-4">
          <p className="eyebrow">Spaced review</p>
          <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[56px]">
            {courseTitle}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
            Revisit prior lessons by choosing the answer that explains the mechanism, not just the label.
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
          <motion.div
            className="h-full rounded-full bg-[var(--accent-strong)]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </section>

      <AnimatePresence mode="wait">
        <motion.section
          key={activePrompt.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="editorial-card px-5 py-6 sm:px-7 sm:py-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
              {activePrompt.unitTitle} · {activeIndex + 1}/{prompts.length}
            </p>
            {complete ? (
              <span className="text-sm text-[var(--text)]">Review complete</span>
            ) : null}
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="text-[32px] font-semibold leading-[1.08] tracking-normal text-[var(--text)]">
              {activePrompt.title}
            </h2>
            <p className="max-w-3xl text-lg leading-8 text-[var(--text-dim)]">
              {activePrompt.summary}
            </p>
          </div>

          <div className="mt-7 space-y-3">
            {options.map((option, index) => {
              const isSelected = selected === option.id
              const isCorrect = checked && option.id === "mechanism"
              const isWrong = checked && isSelected && option.id !== "mechanism"

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelected(option.id)
                    setChecked(false)
                  }}
                  className={cn(
                    "editorial-card interactive-card t-lift w-full px-5 py-5 text-left",
                    isSelected && "border-[var(--border-strong)] bg-[var(--bg-elev-2)]",
                    isCorrect && "border-emerald-300/70 bg-emerald-300/10",
                    isWrong && "border-red-300/70 bg-red-300/10",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-[11px] font-medium text-[var(--text-dim)]">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div>
                      <p className="text-sm uppercase tracking-[0.16em] text-[var(--text-faint)]">
                        {option.label}
                      </p>
                      <p className="mt-2 text-base leading-7 text-[var(--text)]">{option.body}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {checked ? (
            <div className="mt-5 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-elev-2)] px-5 py-4 text-sm leading-7 text-[var(--text-dim)]">
              <div className="flex items-start gap-3">
                {selected === "mechanism" ? (
                  <Check className="mt-1 size-4 text-emerald-700" />
                ) : (
                  <X className="mt-1 size-4 text-red-700" />
                )}
                <p>
                  {selected === "mechanism"
                    ? "Good. You chose the answer that keeps the idea usable."
                    : "Not quite. Review should strengthen the mechanism, not reward a familiar phrase."}
                </p>
              </div>
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-[var(--radius-sm)] border border-red-300/60 bg-red-50 px-5 py-4 text-sm leading-7 text-red-700">
              {error}
            </div>
          ) : null}
        </motion.section>
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
        <Button variant="ghost" onClick={reset}>
          <RotateCcw data-icon="inline-start" />
          Reset
        </Button>
        {complete ? (
          <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-[var(--text)] hover:text-[var(--text-dim)]">
            Return to course
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <Button onClick={checked ? next : () => void check()} disabled={!selected}>
            {checked ? "Next prompt" : "Check"}
            <ArrowRight data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  )
}
