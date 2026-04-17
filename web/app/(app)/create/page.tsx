"use client"

import { useState } from "react"
import { Upload, WandSparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createModes } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type CreateMode = "upload" | "topic"

export default function CreateCoursePage() {
  const [mode, setMode] = useState<CreateMode>("upload")
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("Mathematics")
  const [difficulty, setDifficulty] = useState("Intermediate")
  const [topicPrompt, setTopicPrompt] = useState("")
  const [uploadState, setUploadState] = useState("Drop a PDF, deck, or notes bundle here.")

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="eyebrow">Create course</p>
          <h1 className="serif max-w-3xl text-5xl font-semibold tracking-tight text-[var(--text)]">
            Build the next learning path.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-dim)]">
            Start from source material or begin with a topic. We will shape the
            structure later. For now, this is the shell where creation begins.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {createModes.map((item) => {
            const active = mode === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id as CreateMode)}
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
              <button
                type="button"
                onClick={() =>
                  setUploadState("Files will connect here when the backend lands.")
                }
                className="flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[color:color-mix(in_srgb,var(--bg-soft)_78%,var(--bg))] px-6 text-center"
              >
                <div className="inline-flex size-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elev)]">
                  <Upload className="size-5 text-[var(--accent)]" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-[var(--text)]">
                    Drag your materials here
                  </p>
                  <p className="max-w-md text-sm leading-6 text-[var(--text-dim)]">
                    {uploadState}
                  </p>
                </div>
              </button>
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

            <Button
              size="lg"
              onClick={() => {
                if (mode === "upload") {
                  setUploadState("We are ready to accept files as soon as upload wiring arrives.")
                }
              }}
            >
              Generate course
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
              Start with the clearest source you have. The structure is only as
              strong as the signal in the material.
            </p>
            <p>
              Keep titles direct. Tuto handles warmth in the lesson flow, not in
              the naming.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
