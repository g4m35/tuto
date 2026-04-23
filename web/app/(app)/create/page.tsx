"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, FileText, Upload, WandSparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

type CreateMode = "upload" | "topic"

const createModes = [
  {
    id: "upload" as const,
    title: "From material",
    description: "PDF, notes, or a source document you already trust.",
    icon: Upload,
  },
  {
    id: "topic" as const,
    title: "From a topic",
    description: "Start from a prompt and let Tuto shape the first draft.",
    icon: WandSparkles,
  },
]

function buildPreviewLessons(title: string, topicPrompt: string, mode: CreateMode) {
  const subject = (topicPrompt || title || "your topic").trim()

  if (mode === "upload") {
    return [
      "Orient the material",
      "Extract the governing ideas",
      "Practice the unstable section",
      "Close with a transfer drill",
    ].map((label, index) => `L0${index + 1} · ${label}`)
  }

  const token = subject
    .split(/[\s,:-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")

  return [
    `L01 · ${token || "Frame the subject"}`,
    "L02 · Build the core intuition",
    "L03 · Move into a worked example",
    "L04 · Practice the weak spot",
    "L05 · Synthesize the whole path",
  ]
}

export default function CreateCoursePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [mode, setMode] = useState<CreateMode>("upload")
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("Mathematics")
  const [difficulty, setDifficulty] = useState("Intermediate")
  const [topicPrompt, setTopicPrompt] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState("Drop a PDF, notes bundle, or reading packet here.")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewLessons = useMemo(
    () => buildPreviewLessons(title, topicPrompt, mode),
    [mode, title, topicPrompt]
  )

  async function handleSubmit() {
    setError(null)

    if (!title.trim()) {
      setError("Give the course a title first.")
      return
    }

    if (mode === "topic" && !topicPrompt.trim()) {
      setError("Add a topic prompt so Tuto knows what to generate.")
      return
    }

    if (mode === "upload" && !selectedFile) {
      setError("Upload a source document before generating the course.")
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.set("mode", mode)
      formData.set("title", title.trim())
      formData.set("subject", subject)
      formData.set("difficulty", difficulty)
      formData.set("topicPrompt", topicPrompt.trim())

      if (selectedFile) {
        formData.set("file", selectedFile)
      }

      const response = await fetch("/api/courses", {
        method: "POST",
        body: formData,
      })

      const data = await response.json().catch(() => null)

      if (response.status === 429 && data?.upgrade_url) {
        const pricingUrl = new URL(data.upgrade_url, window.location.origin)
        pricingUrl.searchParams.set("source", "limit")
        pricingUrl.searchParams.set("from", mode === "upload" ? "doc_upload" : "course_created")
        router.push(`${pricingUrl.pathname}${pricingUrl.search}`)
        return
      }

      if (!response.ok) {
        throw new Error(data?.error || "Course generation failed.")
      }

      const courseId = data?.course?.id
      if (!courseId) {
        throw new Error("Course was created but no id came back from the API.")
      }

      router.push(`/courses/${courseId}`)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Course generation failed.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_360px]">
      <section className="space-y-8">
        <div className="space-y-4">
          <p className="eyebrow">Create a course</p>
          <h1 className="serif max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-[var(--text)] sm:text-6xl">
            Tell Tuto what you want to learn. We&apos;ll build the shape of it.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
            Start from material you already have, or begin with a topic and let the first lesson path take form before you commit.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {createModes.map((item) => {
            const active = mode === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMode(item.id)
                  setError(null)
                }}
                className={cn(
                  "editorial-card text-left px-5 py-5",
                  active
                    ? "border-[var(--border-strong)] bg-[var(--bg-elev-2)]"
                    : "hover:border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]"
                )}
              >
                <Icon className="size-4 text-[var(--text-faint)]" />
                <p className="mt-4 text-sm font-medium text-[var(--text)]">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-dim)]">{item.description}</p>
              </button>
            )
          })}
        </div>

        <div className="editorial-card p-6 sm:p-7">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="eyebrow">What do you want to learn?</p>
              <input
                id="course-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Bayesian inference for builders"
                className="w-full border-0 bg-transparent p-0 text-2xl font-medium tracking-[-0.03em] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] sm:text-[2rem]"
              />
            </div>

            {mode === "upload" ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setSelectedFile(file)
                    setStatus(file ? `${file.name} is ready for ingestion.` : "Drop a PDF, notes bundle, or reading packet here.")
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-56 w-full flex-col items-center justify-center gap-4 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] px-6 text-center"
                >
                  <div className="inline-flex size-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elev)]">
                    <Upload className="size-5 text-[var(--text)]" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-[var(--text)]">
                      {selectedFile ? "Source ready" : "Choose your material"}
                    </p>
                    <p className="max-w-md text-sm leading-6 text-[var(--text-dim)]">{status}</p>
                  </div>
                </button>
              </>
            ) : (
              <textarea
                id="topic-prompt"
                value={topicPrompt}
                onChange={(event) => setTopicPrompt(event.target.value)}
                placeholder="Build a slow visual path through Bayesian inference, ending with a practical coding intuition."
                className="min-h-56 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-soft)] px-5 py-5 text-base leading-7 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--border-strong)]"
              />
            )}

            <div className="grid gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="subject" className="text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  Subject
                </label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-4 text-sm text-[var(--text)] outline-none focus:border-[var(--border-strong)]"
                >
                  <option>Mathematics</option>
                  <option>Chemistry</option>
                  <option>History</option>
                  <option>Biology</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="difficulty" className="text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  Depth
                </label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-4 text-sm text-[var(--text)] outline-none focus:border-[var(--border-strong)]"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            {error ? (
              <div className="rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger)]/8 px-4 py-3 text-sm leading-6 text-[var(--text-dim)]">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
              <div className="flex items-center gap-3 text-sm text-[var(--text-faint)]">
                <BookOpen className="size-4" />
                Private by default. Only you see your courses and notes.
              </div>
              <Button size="lg" onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? "Composing..." : "Generate course"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="space-y-2">
          <p className="eyebrow">Preview</p>
          <p className="text-sm leading-6 text-[var(--text-dim)]">
            This is the shape of the draft before the real guide payload arrives.
          </p>
        </div>

        <div className="editorial-card min-h-[28rem] p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
              <span>Draft</span>
              <span>{subject}</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-medium tracking-[-0.04em] text-[var(--text)]">
                {title.trim() || "Your next course"}
              </h2>
              <p className="text-sm leading-6 text-[var(--text-dim)]">
                {mode === "upload"
                  ? selectedFile
                    ? `Built from ${selectedFile.name}.`
                    : "Built from a source document once you choose one."
                  : topicPrompt.trim() || "Start with a topic prompt and the lesson spine will take shape here."}
              </p>
            </div>

            <div className="space-y-2 border-t border-[var(--border)] pt-4">
              {previewLessons.map((lesson) => (
                <div
                  key={lesson}
                  className="flex items-center gap-3 border-b border-[var(--border)] py-3 text-sm text-[var(--text)] last:border-b-0"
                >
                  <FileText className="size-4 text-[var(--text-faint)]" />
                  <span>{lesson}</span>
                </div>
              ))}
            </div>

            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4 text-sm text-[var(--text-dim)]">
              Estimate <span className="text-[var(--text)]">5 lessons · 1h 40m total</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
