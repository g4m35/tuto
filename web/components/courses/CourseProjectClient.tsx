"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRight, Check, ChevronLeft, LoaderCircle, Send, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { StoredProjectSubmission } from "@/lib/course-data"
import type { UnitProjectData } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface CourseProjectClientProps {
  courseId: string
  courseTitle: string
  project: UnitProjectData
  initialSubmission: StoredProjectSubmission | null
}

export function CourseProjectClient({
  courseId,
  courseTitle,
  project,
  initialSubmission,
}: CourseProjectClientProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    () => new Set(initialSubmission?.checklist ?? []),
  )
  const [response, setResponse] = useState(initialSubmission?.response ?? "")
  const [confidence, setConfidence] = useState(initialSubmission?.confidence ?? 50)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(Boolean(initialSubmission))
  const [error, setError] = useState<string | null>(null)
  const complete = checkedItems.size === project.rubric.length && response.trim().length >= 80
  const progress = useMemo(
    () => Math.round(((checkedItems.size + (response.trim().length >= 80 ? 1 : 0)) / (project.rubric.length + 1)) * 100),
    [checkedItems.size, project.rubric.length, response],
  )

  function toggleItem(item: string) {
    setSaved(false)
    setCheckedItems((current) => {
      const next = new Set(current)
      if (next.has(item)) {
        next.delete(item)
      } else {
        next.add(item)
      }
      return next
    })
  }

  async function submit() {
    setSaving(true)
    setError(null)

    try {
      const responseBody = await fetch(`/api/courses/${courseId}/projects/${project.unitId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response,
          checklist: Array.from(checkedItems),
          confidence,
          status: complete ? "complete" : "submitted",
        }),
      })
      const data = await responseBody.json().catch(() => null)
      if (!responseBody.ok) {
        throw new Error(data?.error || "Unable to save project.")
      }
      setSaved(true)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save project.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1060px] flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]">
          <ChevronLeft className="size-4" />
          Back to course
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2 text-sm text-[var(--text-dim)]">
          {saved ? <Check className="size-4 text-[var(--text)]" /> : <Send className="size-4 text-[var(--text)]" />}
          {saved ? "Saved" : "Draft"}
        </div>
      </div>

      <section className="space-y-6">
        <div className="space-y-4">
          <p className="eyebrow">{courseTitle}</p>
          <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[56px]">
            {project.title}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--text-dim)]">
            {project.prompt}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
          <div className="h-full rounded-full bg-[var(--text)] transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="editorial-card px-5 py-6 sm:px-7">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">Project response</p>
          <textarea
            value={response}
            onChange={(event) => {
              setResponse(event.target.value)
              setSaved(false)
            }}
            rows={12}
            className="mt-4 min-h-[280px] w-full resize-y rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-4 py-4 text-base leading-7 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--border-strong)]"
            placeholder="Explain the situation, apply the unit idea, show the decision or solution, then name a limitation."
          />

          <div className="mt-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
              <SlidersHorizontal className="size-4 text-[var(--text)]" />
              Confidence
            </div>
            <input
              aria-label="Project confidence"
              type="range"
              min="0"
              max="100"
              value={confidence}
              onChange={(event) => {
                setConfidence(Number(event.target.value))
                setSaved(false)
              }}
              className="mt-4 w-full accent-[var(--text)]"
            />
            <div className="mt-2 flex justify-between text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
              <span>Needs review</span>
              <span>{confidence}%</span>
              <span>Ready</span>
            </div>
          </div>
        </div>

        <aside className="editorial-card h-fit px-5 py-5">
          <p className="eyebrow">Rubric</p>
          <div className="mt-5 space-y-3">
            {project.rubric.map((item) => {
              const selected = checkedItems.has(item)

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleItem(item)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[var(--radius-sm)] border px-3 py-3 text-left text-sm leading-6",
                    selected
                      ? "border-[var(--border-strong)] bg-[var(--bg)] text-[var(--text)]"
                      : "border-[var(--border)] bg-[var(--bg-elev-2)] text-[var(--text-dim)] hover:border-[var(--border-strong)]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)]",
                      selected && "border-[var(--text)] bg-[var(--text)] text-[var(--accent-ink)]",
                    )}
                  >
                    {selected ? <Check className="size-3.5" /> : null}
                  </span>
                  {item}
                </button>
              )
            })}
          </div>

          {error ? (
            <div className="mt-4 rounded-[var(--radius-sm)] border border-red-300/60 bg-red-300/10 px-4 py-3 text-sm leading-6 text-red-100">
              {error}
            </div>
          ) : null}

          <Button className="mt-5 w-full" onClick={() => void submit()} disabled={saving || !response.trim()}>
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Send data-icon="inline-start" />}
            {complete ? "Submit complete project" : "Save project"}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </aside>
      </section>
    </div>
  )
}
