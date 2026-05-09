"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Check, Copy, Download, FileText, Link2, Presentation, Share2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { getCourseArtifactOption, type CourseArtifactKind } from "@/lib/course-artifacts"
import { cn } from "@/lib/utils"

interface CourseArtifactActionsProps {
  courseId: string
  artifactTitle: string
  artifactKind?: CourseArtifactKind | string | null
  initialShareEnabled?: boolean
  initialShareToken?: string | null
}

type ShareStatus = "idle" | "working" | "copied" | "error"
type ExportAction = {
  format: "markdown" | "html" | "pptx" | "docx" | "slides"
  label: string
  icon: typeof Download
  primary?: boolean
}

function getExportActions(kind: CourseArtifactKind): ExportAction[] {
  if (kind === "slides") {
    return [
      { format: "pptx", label: "Google Slides deck", icon: Upload, primary: true },
      { format: "slides", label: "Speaker notes", icon: Presentation },
    ]
  }

  if (kind === "study-guide" || kind === "cheat-sheet" || kind === "lesson-plan") {
    return [
      { format: "docx", label: "Google Docs file", icon: FileText, primary: true },
      { format: "markdown", label: "Markdown", icon: Download },
      { format: "html", label: "HTML", icon: FileText },
    ]
  }

  if (kind === "quiz-set") {
    return [
      { format: "markdown", label: "Answer guide", icon: Download, primary: true },
      { format: "html", label: "Web view", icon: FileText },
    ]
  }

  return [
    { format: "markdown", label: "Course notes", icon: Download, primary: true },
    { format: "html", label: "HTML", icon: FileText },
    { format: "pptx", label: "Slides file", icon: Upload },
    { format: "docx", label: "Google Docs", icon: FileText },
    { format: "slides", label: "Outline notes", icon: Presentation },
  ]
}

function getActionDescription(kind: CourseArtifactKind) {
  if (kind === "slides") {
    return "Export a Slides-ready deck or presenter notes."
  }

  if (kind === "quiz-set") {
    return "Export an answer guide or share a read-only link."
  }

  if (kind === "study-guide" || kind === "cheat-sheet" || kind === "lesson-plan") {
    return "Export Docs-ready files, Markdown, HTML, or a share link."
  }

  return "Export files or share a read-only link."
}

export function CourseArtifactActions({
  courseId,
  artifactTitle,
  artifactKind,
  initialShareEnabled = false,
  initialShareToken = null,
}: CourseArtifactActionsProps) {
  const [shareEnabled, setShareEnabled] = useState(initialShareEnabled)
  const [shareToken, setShareToken] = useState(initialShareToken)
  const [origin, setOrigin] = useState("")
  const [status, setStatus] = useState<ShareStatus>("idle")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const shareUrl = useMemo(() => {
    if (!shareEnabled || !shareToken || !origin) return null
    return `${origin}/share/${shareToken}`
  }, [origin, shareEnabled, shareToken])
  const artifact = getCourseArtifactOption(artifactKind)
  const exportActions = getExportActions(artifact.kind)

  async function enableShare() {
    setStatus("working")
    setMessage(null)

    try {
      const response = await fetch(`/api/courses/${courseId}/share`, { method: "POST" })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || "Unable to create share link.")
      }

      setShareEnabled(true)
      setShareToken(data?.shareToken ?? null)
      setStatus("idle")
      setMessage("Share link is ready.")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Unable to create share link.")
    }
  }

  async function disableShare() {
    setStatus("working")
    setMessage(null)

    try {
      const response = await fetch(`/api/courses/${courseId}/share`, { method: "DELETE" })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || "Unable to turn off sharing.")
      }

      setShareEnabled(false)
      setStatus("idle")
      setMessage("Share link turned off.")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Unable to turn off sharing.")
    }
  }

  async function copyShareLink() {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setStatus("copied")
      setMessage("Copied share link.")
      window.setTimeout(() => setStatus("idle"), 1400)
    } catch {
      setStatus("error")
      setMessage("Could not copy automatically. Select the link and copy it.")
    }
  }

  return (
    <div className="editorial-card space-y-5 px-5 py-5 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div className="space-y-2">
          <p className="eyebrow">Share and download</p>
          <p className="text-sm leading-6 text-[var(--text-dim)]">
            {getActionDescription(artifact.kind)}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {exportActions.map((action) => {
            const Icon = action.icon

            return (
              <Link
                key={action.format}
                href={`/api/courses/${courseId}/download?format=${action.format}`}
                className={cn(
                  "t-btn inline-flex h-[42px] items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-4 text-[13px] font-medium text-[var(--text)]",
                  action.primary && "bg-[var(--bg-soft)]"
                )}
              >
                <Icon className="size-4" />
                {action.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-sm text-[var(--text-dim)]">
          {shareUrl ? (
            <a href={shareUrl} className="inline-flex max-w-full items-center gap-2 text-[var(--text)] hover:text-[var(--text-dim)]">
              <Link2 className="size-4 shrink-0" />
              <span className="truncate">{shareUrl}</span>
            </a>
          ) : (
            <span>{shareEnabled ? "Preparing share link..." : "Sharing is off."}</span>
          )}
          {message ? (
            <p className={status === "error" ? "mt-2 text-[var(--danger)]" : "mt-2 text-[var(--text-faint)]"}>
              {message}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {shareEnabled ? (
            <>
              <Button variant="secondary" onClick={() => void copyShareLink()} disabled={!shareUrl || status === "working"}>
                {status === "copied" ? <Check className="size-4" /> : <Copy className="size-4" />}
                Copy link
              </Button>
              <Button variant="ghost" onClick={() => void disableShare()} disabled={status === "working"}>
                <X className="size-4" />
                Turn off
              </Button>
            </>
          ) : (
            <Button onClick={() => void enableShare()} disabled={status === "working"}>
              <Share2 className="size-4" />
              Create share link
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
