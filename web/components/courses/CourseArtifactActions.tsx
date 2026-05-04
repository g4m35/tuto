"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Check, Copy, Download, FileText, Link2, Presentation, Share2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { getCourseArtifactOption, type CourseArtifactKind } from "@/lib/course-artifacts"

interface CourseArtifactActionsProps {
  courseId: string
  artifactTitle: string
  artifactKind?: CourseArtifactKind | string | null
  initialShareEnabled?: boolean
  initialShareToken?: string | null
}

type ShareStatus = "idle" | "working" | "copied" | "error"

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
  const googleSlidesLabel = artifact.kind === "slides" ? "Google Slides" : "Slides file"
  const notesLabel = artifact.kind === "slides" ? "Speaker notes" : "Outline notes"

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
            Export this {artifactTitle.toLowerCase()}, download files for Google Docs or Slides, or create a read-only public link.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Link href={`/api/courses/${courseId}/download?format=markdown`} className="t-btn inline-flex h-[42px] items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-4 text-[13px] font-medium text-[var(--text)]">
            <Download className="size-4" />
            Markdown
          </Link>
          <Link href={`/api/courses/${courseId}/download?format=html`} className="t-btn inline-flex h-[42px] items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-4 text-[13px] font-medium text-[var(--text)]">
            <FileText className="size-4" />
            HTML
          </Link>
          <Link href={`/api/courses/${courseId}/download?format=pptx`} className="t-btn inline-flex h-[42px] items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-soft)] px-4 text-[13px] font-medium text-[var(--text)]">
            <Upload className="size-4" />
            {googleSlidesLabel}
          </Link>
          <Link href={`/api/courses/${courseId}/download?format=docx`} className="t-btn inline-flex h-[42px] items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-soft)] px-4 text-[13px] font-medium text-[var(--text)]">
            <FileText className="size-4" />
            Google Docs
          </Link>
          <Link href={`/api/courses/${courseId}/download?format=slides`} className="t-btn inline-flex h-[42px] items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-4 text-[13px] font-medium text-[var(--text)]">
            <Presentation className="size-4" />
            {notesLabel}
          </Link>
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
