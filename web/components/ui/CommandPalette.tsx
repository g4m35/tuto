"use client"

import { type ComponentType, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Bot, Brain, Library, MessageSquare, PenLine, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

type CommandItem = {
  id: string
  href?: string
  label: string
  hint: string
  icon: ComponentType<{ className?: string }>
}

const commandItems: CommandItem[] = [
  {
    id: "chat",
    href: "/chat",
    label: "Open chat",
    hint: "Workspace",
    icon: MessageSquare,
  },
  {
    id: "agents",
    href: "/agents",
    label: "Open agents",
    hint: "Workspace",
    icon: Bot,
  },
  {
    id: "writer",
    href: "/co-writer",
    label: "Open writer",
    hint: "Workspace",
    icon: PenLine,
  },
  {
    id: "book",
    href: "/book",
    label: "Open book",
    hint: "Workspace",
    icon: Library,
  },
  {
    id: "knowledge",
    href: "/knowledge",
    label: "Open knowledge",
    hint: "Workspace",
    icon: BookOpen,
  },
  {
    id: "memory",
    href: "/memory",
    label: "Open memory",
    hint: "Workspace",
    icon: Brain,
  },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((value) => {
          const next = !value
          if (!next) {
            setQuery("")
          }
          return next
        })
      }

      if (event.key === "Escape") {
        setOpen(false)
        setQuery("")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredItems = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase()
    if (!normalized) {
      return commandItems
    }

    return commandItems.filter((item) =>
      [item.label, item.hint].some((value) => value.toLowerCase().includes(normalized))
    )
  }, [deferredQuery])

  const navigate = (item: CommandItem) => {
    setOpen(false)

    if (!item.href) {
      return
    }

    startTransition(() => {
      router.push(item.href!)
    })
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setQuery("")
            setOpen(true)
          }}
          className="hidden min-w-[15rem] items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3.5 py-2 text-left text-sm text-[var(--text-dim)] transition-all duration-200 ease-[var(--ease-signature)] hover:border-[var(--border-strong)] hover:text-[var(--text)] lg:inline-flex"
        >
          <Search className="size-4 text-[var(--text-faint)]" />
          <span className="flex-1">Jump to anything</span>
          <span className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[var(--text-faint)]">
            Cmd K
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery("")
            setOpen(true)
          }}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-faint)] transition-all duration-200 ease-[var(--ease-signature)] hover:border-[var(--border-strong)] hover:text-[var(--text)] lg:hidden"
          aria-label="Open command palette"
        >
          <Search className="size-4" />
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex animate-[t-fade_180ms_var(--ease-signature)_both] items-start justify-center bg-black/70 px-4 pt-28 backdrop-blur-md"
          onClick={() => {
            setOpen(false)
            setQuery("")
          }}
        >
          <div className="surface-panel w-full max-w-2xl animate-[t-scale-in_180ms_var(--ease-signature)_both] overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
              <Search className="size-4 text-[var(--text-faint)]" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Jump to anything"
                className="flex-1 border-0 bg-transparent text-base text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
              />
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setQuery("")
                }}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elev)] p-2 text-[var(--text-faint)] transition-all duration-200 ease-[var(--ease-signature)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                aria-label="Close command palette"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[24rem] overflow-y-auto p-2">
              {filteredItems.length ? (
                filteredItems.map((item, index) => {
                  const Icon = item.icon

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-[var(--radius-sm)] px-4 py-3 text-left transition-colors duration-200 ease-[var(--ease-signature)] hover:bg-[var(--bg-elev-2)]",
                        index === 0 && "animate-rise-in"
                      )}
                    >
                      <span className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-faint)]">
                        <Icon className="size-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-[var(--text)]">
                          {item.label}
                        </span>
                        <span className="block text-xs uppercase tracking-[0.14em] text-[var(--text-faint)]">
                          {item.hint}
                        </span>
                      </span>
                      {item.href ? (
                        <span className="text-xs uppercase tracking-[0.14em] text-[var(--text-faint)]">
                          open
                        </span>
                      ) : null}
                    </button>
                  )
                })
              ) : (
                <div className="px-4 py-10 text-center text-sm text-[var(--text-dim)]">
                  No matches yet for <span className="text-[var(--text)]">{deferredQuery}</span>.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-xs uppercase tracking-[0.14em] text-[var(--text-faint)]">
              <span>Routes and launch tools</span>
              <span>{isPending ? "Opening..." : "Enter to open"}</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
