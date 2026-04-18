"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, WandSparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createModes } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type CreateMode = "upload" | "topic"

export default function CreateCoursePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [mode, setMode] = useState<CreateMode>("upload")
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("Mathematics")
  const [difficulty, setDifficulty] = useState("Intermediate")
  const [topicPrompt, setTopicPrompt] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState("Drop a PDF, deck, or notes bundle here.")
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
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="eyebrow">Create course</p>
          <h1 className="serif max-w-3xl text-5xl font-semibold tracking-tight text-[var(--text)]">
            Build the next learning path.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
            Start from source material or begin with a topic. This flow now calls the
            DeepTutor backend instead of mock data.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {createModes.map((item) => {
            const active = mode === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMode(item.id as CreateMode)
                  setError(null)
                }}
                className={cn(
                  "rounded-[var(--radius)] border p-5 text-left",
                  active
                    ? "border-[color:color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_8%,var(--bg-soft))]"
                    : "border-[var(--border)] bg-[var(--bg-elev)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-soft)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)]">
                    {item.id === "upload" ? (
                      <Upload className="size-4 text-[var(--accent)]" />
                    ) : (
                      <WandSparkles className="size-4 text-[var(--accent)]" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text)]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-dim)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)] py-0">
          <CardHeader className="border-b border-[var(--border)] px-6 py-5">
            <CardTitle className="text-xl text-[var(--text)]">
              {mode === "upload" ? "Upload document" : "Generate from topic"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-6">
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
                    setStatus(file ? `${file.name} is ready for ingestion.` : "Drop a PDF, deck, or notes bundle here.")
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[color:color-mix(in_srgb,var(--bg-soft)_78%,var(--bg))] px-6 text-center"
                >
                  <div className="inline-flex size-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elev)]">
                    <Upload className="size-5 text-[var(--accent)]" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-[var(--text)]">
                      {selectedFile ? "Source ready" : "Choose your materials"}
                    </p>
                    <p className="max-w-md text-sm leading-6 text-[var(--text-dim)]">
                      {status}
                    </p>
                  </div>
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <label
                  htmlFor="topic-prompt"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  Topic prompt
                </label>
                <textarea
                  id="topic-prompt"
                  value={topicPrompt}
                  onChange={(event) => setTopicPrompt(event.target.value)}
                  placeholder="Example: Build a five lesson course that teaches eigenvectors through geometric intuition and short visual drills."
                  className="min-h-64 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4 text-base text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--border-strong)]"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-5">
        <Card className="surface-card border-[var(--border)] bg-[var(--bg-elev)]">
          <CardHeader>
            <CardTitle className="text-xl text-[var(--text)]">
              Course details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="course-title" className="text-sm text-[var(--text-dim)]">
                Course title
              </label>
              <input
                id="course-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Linear algebra for machine learning"
                className="h-12 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--border-strong)]"
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
                  className="h-12 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 text-[var(--text)] outline-none focus:border-[var(--border-strong)]"
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
                  className="h-12 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 text-[var(--text)] outline-none focus:border-[var(--border-strong)]"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            {error ? (
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-6 text-[var(--text-dim)]">
                {error}
              </div>
            ) : null}

            <Button
              size="lg"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? "Generating course..." : "Generate course"}
            </Button>
          </CardContent>
        </Card>

        <Card className="surface-card border-[var(--border)] bg-[color:color-mix(in_srgb,var(--accent)_9%,var(--bg-elev))]">
          <CardHeader>
            <CardTitle className="text-xl text-[var(--text)]">
              Creation notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-[var(--text-dim)]">
            <p>
              Upload mode creates a DeepTutor knowledge base first, then adapts the existing guided-learning API to produce the course shell.
            </p>
            <p>
              Topic mode goes straight into Guided Learning and returns a flat knowledge-point path, which this UI groups into units.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
