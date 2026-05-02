"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  ClipboardList,
  FileQuestion,
  FileText,
  Presentation,
  Upload,
  WandSparkles,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  courseArtifactOptions,
  getCourseArtifactOption,
  type CourseArtifactKind,
} from "@/lib/course-artifacts"
import { trackMarketingEvent } from "@/lib/marketing-client"
import { cn } from "@/lib/utils"

type CreateMode = "upload" | "topic"

const artifactIconMap = {
  course: BookOpen,
  "study-guide": FileText,
  slides: Presentation,
  "quiz-set": FileQuestion,
  "lesson-plan": ClipboardList,
} satisfies Record<CourseArtifactKind, typeof BookOpen>

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

const generationStages = [
  "Reading source",
  "Building outline",
  "Writing sections",
  "Adding practice",
  "Saving course card",
] as const

function buildPreviewItems(
  title: string,
  topicPrompt: string,
  mode: CreateMode,
  artifactKind: CourseArtifactKind,
) {
  const subject = (topicPrompt || title || "your topic").trim()
  const artifact = getCourseArtifactOption(artifactKind)

  if (mode === "upload") {
    return artifact.previewItems.map((label, index) => `${String(index + 1).padStart(2, "0")} - ${label}`)
  }

  const token = subject
    .split(/[\s,:-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")

  return artifact.previewItems.map((label, index) =>
    index === 0 && token ? `${String(index + 1).padStart(2, "0")} - ${token}` : `${String(index + 1).padStart(2, "0")} - ${label}`,
  )
}

function getReadableSource(mode: CreateMode, selectedFile: File | null, topicPrompt: string) {
  if (mode === "upload") {
    return selectedFile?.name || "Source document";
  }

  const prompt = topicPrompt.trim().replace(/\s+/g, " ")
  return prompt ? prompt.slice(0, 96) : "Topic prompt"
}

function getPreviewTitle(title: string, artifactKind: CourseArtifactKind) {
  const artifact = getCourseArtifactOption(artifactKind)
  return title.trim() || `Untitled ${artifact.noun}`
}

function CourseGenerationProgress({
  artifactTitle,
  progress,
  stage,
}: {
  artifactTitle: string
  progress: number
  stage: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4"
    >
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-[var(--text)]">Building {artifactTitle.toLowerCase()}</span>
        <span className="text-[var(--text-faint)]">{progress}%</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-elev)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),#2cb7a4,#4a8cff)] transition-[width] duration-500 ease-[var(--ease-signature)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1" aria-hidden="true">
        {generationStages.map((item) => {
          const active = item === stage
          return (
            <span
              key={item}
              className={cn(
                "h-1 rounded-full transition-colors duration-300",
                active ? "bg-[var(--text)]" : "bg-[var(--border-strong)]"
              )}
            />
          )
        })}
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">{stage}</p>
    </div>
  )
}

export default function CreateCoursePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [artifactKind, setArtifactKind] = useState<CourseArtifactKind>("course")
  const [mode, setMode] = useState<CreateMode>("upload")
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [difficulty, setDifficulty] = useState("Beginner")
  const [topicPrompt, setTopicPrompt] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState("Drop a PDF, notes bundle, or reading packet here.")
  const [submitting, setSubmitting] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const selectedArtifact = getCourseArtifactOption(artifactKind)
  const previewItems = useMemo(
    () => buildPreviewItems(title, topicPrompt, mode, artifactKind),
    [artifactKind, mode, title, topicPrompt]
  )

  useEffect(() => {
    trackMarketingEvent("course_create_page_viewed")
  }, [])

  useEffect(() => {
    if (!submitting) {
      setGenerationStep(0)
      return
    }

    const timer = window.setInterval(() => {
      setGenerationStep((step) => Math.min(step + 1, generationStages.length - 1))
    }, 2400)

    return () => window.clearInterval(timer)
  }, [submitting])

  async function handleSubmit() {
    setError(null)

    if (!title.trim()) {
      setError(`Give the ${selectedArtifact.noun} a title first.`)
      trackMarketingEvent("course_create_validation_failed", { reason: "missing_title", mode })
      return
    }

    if (mode === "topic" && !topicPrompt.trim()) {
      setError("Add a topic prompt so Tuto knows what to generate.")
      trackMarketingEvent("course_create_validation_failed", { reason: "missing_topic_prompt", mode })
      return
    }

    if (mode === "upload" && !selectedFile) {
      setError(`Upload a source document before generating the ${selectedArtifact.noun}.`)
      trackMarketingEvent("course_create_validation_failed", { reason: "missing_upload", mode })
      return
    }

    setSubmitting(true)
    trackMarketingEvent("course_create_started", {
      mode,
      artifact_kind: artifactKind,
      difficulty,
      has_subject: Boolean(subject.trim()),
      has_topic_prompt: Boolean(topicPrompt.trim()),
      file_type: selectedFile?.name.split(".").pop()?.toLowerCase() ?? null,
      file_size: selectedFile?.size ?? null,
    })

    try {
      const formData = new FormData()
      formData.set("mode", mode)
      formData.set("artifactKind", artifactKind)
      formData.set("title", title.trim())
      formData.set("subject", subject.trim() || title.trim())
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
        trackMarketingEvent("course_create_limit_hit", {
          mode,
          tier: data?.tier,
          limit: data?.limit,
          current: data?.current,
        })
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

      trackMarketingEvent("course_create_completed", {
        mode,
        artifact_kind: artifactKind,
        course_id: courseId,
        backend_mode: data?.course?.backendMode,
      })
      router.push(`/courses/${courseId}`)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Course generation failed.")
      trackMarketingEvent("course_create_failed", {
        mode,
        artifact_kind: artifactKind,
        error: nextError instanceof Error ? nextError.message : "Course generation failed.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-7">
        <div className="space-y-5">
          <p className="t-eyebrow">
            <span className="t-eyebrow__rule" aria-hidden="true" />
            <span>Create</span>
          </p>
          <h1 className="max-w-3xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[48px]">
            Create something new
          </h1>
          <p className="max-w-2xl text-[20px] leading-8 text-[var(--text-dim)]">
            Choose what you need, then turn a source or prompt into a downloadable artifact.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] uppercase leading-none tracking-[0.18em] text-[var(--text-faint)]">
            What do you want to make?
          </p>
          <div className="grid gap-3 lg:grid-cols-5">
            {courseArtifactOptions.map((item, index) => {
              const active = artifactKind === item.kind
              const Icon = artifactIconMap[item.kind]

              return (
                <button
                  key={item.kind}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setArtifactKind(item.kind)
                    setError(null)
                    trackMarketingEvent("course_create_artifact_selected", { artifact_kind: item.kind })
                  }}
                  className={cn(
                    "editorial-card interactive-card t-lift min-h-[150px] text-left px-4 py-4 disabled:pointer-events-none disabled:opacity-60",
                    index % 2 === 0 ? "animate-rise-in-delay-1" : "animate-rise-in-delay-2",
                    active
                      ? "border-[var(--border-strong)] bg-[var(--bg-elev-2)]"
                      : "hover:border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]"
                  )}
                >
                  <Icon className="size-4 text-[var(--text-faint)]" />
                  <p className="mt-4 text-sm font-medium text-[var(--text)]">{item.title}</p>
                  <p className="mt-1 text-[13px] leading-5 text-[var(--text-dim)]">{item.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] uppercase leading-none tracking-[0.18em] text-[var(--text-faint)]">
            What should Tuto use?
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {createModes.map((item, index) => {
              const active = mode === item.id
              const Icon = item.icon

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setMode(item.id)
                    setError(null)
                    trackMarketingEvent("course_create_mode_selected", { mode: item.id })
                  }}
                  className={cn(
                    "editorial-card interactive-card t-lift text-left px-5 py-5 disabled:pointer-events-none disabled:opacity-60",
                    index === 0 ? "animate-rise-in-delay-1" : "animate-rise-in-delay-2",
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
        </div>

        <div className="editorial-card animate-rise-in p-5 sm:p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[11px] uppercase leading-none tracking-[0.18em] text-[var(--text-faint)]">What is it about?</p>
              <input
                id="course-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={artifactKind === "slides" ? "Photosynthesis presentation" : "How photosynthesis works"}
                className="w-full border-0 bg-transparent p-0 text-[28px] font-medium leading-tight tracking-normal text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
              />
            </div>

            {mode === "upload" ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.doc,.docx,.ppt,.pptx"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setSelectedFile(file)
                    setStatus(file ? `${file.name} is ready to use.` : "Drop a PDF, notes bundle, or reading packet here.")
                    if (file) {
                      trackMarketingEvent("course_create_file_selected", {
                        file_type: file.name.split(".").pop()?.toLowerCase() ?? null,
                        file_size: file.size,
                      })
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-48 w-full flex-col items-center justify-center gap-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] px-6 text-center"
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
                placeholder="Explain photosynthesis like I am new to it. Use simple examples and a quick practice question."
                className="min-h-48 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-5 py-5 text-base leading-7 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--border-strong)]"
              />
            )}

            <div className="grid gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="subject" className="text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  Topic
                </label>
                <input
                  id="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Photosynthesis, fractions, ancient Rome..."
                  className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-4 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--border-strong)]"
                />
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
                Private by default. You can share or download it after generation.
              </div>
              <Button size="lg" onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? `Generating ${selectedArtifact.noun}` : `Generate ${selectedArtifact.noun}`}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="space-y-2">
          <p className="t-eyebrow">
            <span className="t-eyebrow__rule" aria-hidden="true" />
            <span>Preview</span>
          </p>
          <p className="text-sm leading-6 text-[var(--text-dim)]">
            This is how the saved card will read once Tuto finishes.
          </p>
        </div>

        <div className="editorial-card animate-rise-in-delay-2 min-h-[28rem] p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
              <span>{mode === "upload" ? "From material" : "From topic"}</span>
              <span>{selectedArtifact.title}</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-medium tracking-normal text-[var(--text)]">
                {getPreviewTitle(title, artifactKind)}
              </h2>
              <p className="text-sm leading-6 text-[var(--text-dim)]">
                {selectedArtifact.description}
              </p>
            </div>

            <div className="grid gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-faint)]">Source</span>
                <span className="max-w-[230px] truncate text-right text-[var(--text)]">
                  {getReadableSource(mode, selectedFile, topicPrompt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-faint)]">Topic</span>
                <span className="max-w-[230px] truncate text-right text-[var(--text)]">
                  {subject.trim() || title.trim() || "Not set yet"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-faint)]">Depth</span>
                <span className="text-[var(--text)]">{difficulty}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-[var(--border)] pt-4">
              {previewItems.map((lesson) => (
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
              Estimate <span className="text-[var(--text)]">{selectedArtifact.estimate}</span>
            </div>

            {submitting ? (
              <CourseGenerationProgress
                artifactTitle={selectedArtifact.title}
                progress={Math.min(94, 18 + generationStep * 19)}
                stage={generationStages[generationStep] ?? generationStages[0]}
              />
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  )
}
