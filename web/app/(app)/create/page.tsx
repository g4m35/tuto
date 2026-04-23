"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { FileText, Layers3, Sparkles, Upload, WandSparkles } from "lucide-react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { createModes } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type CreateMode = "upload" | "topic"

const panelTransition = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1] as const,
}

export default function CreateCoursePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const shouldReduceMotion = useReducedMotion()
  const [mode, setMode] = useState<CreateMode>("upload")
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("Mathematics")
  const [difficulty, setDifficulty] = useState("Intermediate")
  const [topicPrompt, setTopicPrompt] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState("Choose a PDF, text file, or markdown document to build the course.")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)

    if (!title.trim()) {
      setError("Give the course a title first.")
      return
    }

    if (mode === "topic" && !topicPrompt.trim()) {
      setError("Add a topic prompt so DeepTutor knows what to generate.")
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

      if (!response.ok) {
        if (response.status === 429 && typeof data?.upgrade_url === "string") {
          const upgradeUrl = new URL(data.upgrade_url, window.location.origin)
          upgradeUrl.searchParams.set("reason", "limit")
          upgradeUrl.searchParams.set("source", mode === "upload" ? "document_upload" : "course_creation")
          upgradeUrl.searchParams.set("from", "/create")
          router.push(`${upgradeUrl.pathname}${upgradeUrl.search}`)
          return
        }

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
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="flex flex-col gap-6">
        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? undefined : panelTransition}
          className="surface-card overflow-hidden rounded-[32px] p-6 sm:p-8"
        >
          <div className="app-grid rounded-[28px] border border-[var(--border)] bg-[var(--bg-elev)]/78 p-6">
            <p className="eyebrow">Create course</p>
            <div className="mt-4 max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
                Build a minimal learning workspace around one topic at a time.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--text-dim)] sm:text-lg">
                Start from source material or generate from a prompt. The flow is now tuned
                to feel lighter, calmer, and more direct.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                {
                  title: "Single input",
                  body: "One topic or one upload begins the path.",
                  icon: FileText,
                },
                {
                  title: "Clean progression",
                  body: "Generated lessons turn into a focused active queue.",
                  icon: Layers3,
                },
                {
                  title: "Adaptive review",
                  body: "Weak spots stay in view while the rest stays quiet.",
                  icon: Sparkles,
                },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.title}
                    className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-elev)]/90 p-4"
                  >
                    <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--accent)]">
                      <Icon className="size-[18px]" />
                    </div>
                    <h2 className="mt-4 font-medium text-[var(--text)]">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{item.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? undefined : { ...panelTransition, delay: 0.08 }}
          className="surface-card rounded-[32px] p-6 sm:p-8"
        >
          <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-5">
            <div className="space-y-2">
              <p className="eyebrow">Input mode</p>
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)]">
                Choose the source for the next course.
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {createModes.map((item) => {
                const active = mode === item.id
                const Icon = item.id === "upload" ? Upload : WandSparkles

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMode(item.id as CreateMode)
                      setError(null)
                    }}
                    className={cn(
                      "rounded-[26px] border p-5 text-left transition-all",
                      active
                        ? "border-[color:color-mix(in_srgb,var(--accent)_30%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_8%,white)] shadow-sm"
                        : "border-[var(--border)] bg-[var(--bg-elev)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-soft)]/70"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={cn(
                          "inline-flex size-11 items-center justify-center rounded-2xl border shadow-sm",
                          active
                            ? "border-blue-200 bg-white text-[var(--accent)]"
                            : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-faint)]"
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="font-medium text-[var(--text)]">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-6">
            <AnimatePresence mode="wait">
              {mode === "upload" ? (
                <motion.div
                  key="upload"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
                  transition={shouldReduceMotion ? undefined : { duration: 0.24 }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      setSelectedFile(file)
                      setStatus(
                        file
                          ? `${file.name} is ready for ingestion.`
                          : "Choose a PDF, text file, or markdown document to build the course."
                      )
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex min-h-[320px] w-full flex-col items-center justify-center gap-5 rounded-[30px] border border-dashed border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.8))] px-6 text-center"
                  >
                    <span className="inline-flex size-16 items-center justify-center rounded-[24px] bg-[var(--bg-elev)] text-[var(--accent)] shadow-sm transition-transform duration-200 group-hover:-translate-y-1">
                      <Upload className="size-6" />
                    </span>
                    <div className="space-y-2">
                      <p className="text-xl font-semibold text-[var(--text)]">
                        {selectedFile ? "Source ready" : "Choose your materials"}
                      </p>
                      <p className="mx-auto max-w-md text-sm leading-6 text-[var(--text-dim)]">
                        {status}
                      </p>
                    </div>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="topic"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
                  transition={shouldReduceMotion ? undefined : { duration: 0.24 }}
                  className="space-y-3"
                >
                  <label htmlFor="topic-prompt" className="text-sm font-medium text-[var(--text)]">
                    Topic prompt
                  </label>
                  <textarea
                    id="topic-prompt"
                    value={topicPrompt}
                    onChange={(event) => setTopicPrompt(event.target.value)}
                    placeholder="Example: Build a five lesson course that teaches eigenvectors through geometric intuition and short visual drills."
                    className="min-h-[320px] w-full rounded-[30px] border border-[var(--border)] bg-[var(--bg-elev)] px-5 py-5 text-base leading-7 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--border-strong)]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>

      <motion.aside
        initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
        transition={shouldReduceMotion ? undefined : { ...panelTransition, delay: 0.14 }}
        className="flex flex-col gap-6 xl:sticky xl:top-24 xl:h-fit"
      >
        <section className="surface-card rounded-[32px] p-6 sm:p-7">
          <p className="eyebrow">Course details</p>
          <div className="mt-5 grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="course-title" className="text-sm text-[var(--text-dim)]">
                Course title
              </label>
              <input
                id="course-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Linear algebra for machine learning"
                className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] px-4 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--border-strong)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="subject" className="text-sm text-[var(--text-dim)]">
                  Subject
                </label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] px-4 text-[var(--text)] outline-none focus:border-[var(--border-strong)]"
                >
                  <option>Mathematics</option>
                  <option>Chemistry</option>
                  <option>History</option>
                  <option>Biology</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="difficulty" className="text-sm text-[var(--text-dim)]">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] px-4 text-[var(--text)] outline-none focus:border-[var(--border-strong)]"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            <div className="rounded-[26px] border border-[var(--border)] bg-[var(--bg-soft)]/70 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-faint)]">
                Build preview
              </p>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-dim)]">
                <div className="flex items-center justify-between gap-3">
                  <span>Source mode</span>
                  <span className="rounded-full bg-[var(--bg-elev)] px-3 py-1 text-[var(--text)] shadow-sm">
                    {mode === "upload" ? "Upload" : "Topic"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Subject</span>
                  <span className="text-[var(--text)]">{subject}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Difficulty</span>
                  <span className="text-[var(--text)]">{difficulty}</span>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            ) : null}

            <Button
              size="lg"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="rounded-full"
            >
              {submitting ? "Generating course..." : "Generate course"}
            </Button>
          </div>
        </section>

        <section className="surface-card rounded-[32px] p-6 sm:p-7">
          <p className="eyebrow">Creation notes</p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--text-dim)]">
            <p>
              Upload mode creates a DeepTutor knowledge base first, then shapes a guided course
              from the extracted material.
            </p>
            <p>
              Topic mode skips the upload step and goes straight into guided learning, which keeps
              the flow quick for exploration and prototyping.
            </p>
          </div>
        </section>
      </motion.aside>
    </div>
  )
}
