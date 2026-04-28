"use client"

import { type ComponentType, type KeyboardEvent as ReactKeyboardEvent, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Braces, CornerDownLeft, Grid2x2, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type CommandItem = {
  id: string
  href?: string
  label: string
  hint: string
  shortcut?: string
  icon: ComponentType<{ className?: string }>
}

const commandItems: CommandItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Go to dashboard",
    hint: "Route",
    icon: Grid2x2,
  },
  {
    id: "courses",
    href: "/courses",
    label: "Go to courses",
    hint: "Route",
    icon: BookOpen,
  },
  {
    id: "create",
    href: "/create",
    label: "Create new course",
    hint: "Route",
    shortcut: "N",
    icon: Plus,
  },
  {
    id: "review",
    href: "/review",
    label: "Go to review",
    hint: "Route",
    icon: Braces,
  },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    for (const item of commandItems) {
      if (item.href) {
        router.prefetch(item.href)
      }
    }
  }, [router])

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
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

  useEffect(() => {
    setActiveIndex(0)
  }, [deferredQuery, open])

  const handlePaletteKeyDown = (event: ReactKeyboardEvent) => {
    if (!filteredItems.length) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % filteredItems.length)
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + filteredItems.length) % filteredItems.length)
    }

    if (event.key === "Enter") {
      event.preventDefault()
      navigate(filteredItems[activeIndex]!)
    }
  }

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
          className="hidden h-10 min-w-[19rem] items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-4 text-left text-sm text-[var(--text-dim)] transition-all duration-200 ease-[var(--ease-signature)] hover:border-[var(--border-strong)] hover:text-[var(--text)] lg:inline-flex"
        >
          <Search className="size-4 text-[var(--text-faint)]" />
          <span className="flex-1">Jump to anything</span>
          <span className="rounded-[7px] border border-[var(--border)] bg-[var(--bg-elev-2)] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[var(--text-faint)]">
            ⌘K
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
          className="fixed inset-0 isolate z-[70] flex animate-[t-fade_180ms_var(--ease-signature)_both] items-start justify-center px-4 pt-[17vh]"
          onClick={() => {
            setOpen(false)
            setQuery("")
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-black/52 backdrop-blur-[34px]"
            style={{
              WebkitBackdropFilter: "blur(34px) saturate(0.62) brightness(0.72)",
              backdropFilter: "blur(34px) saturate(0.62) brightness(0.72)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.58))]" />
          <div
            className="surface-panel relative w-full max-w-[760px] animate-[t-scale-in_180ms_var(--ease-signature)_both] overflow-hidden border-[var(--border-strong)] shadow-[0_32px_90px_-36px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.05)]"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handlePaletteKeyDown}
          >
            <div className="flex items-center gap-4 border-b border-[var(--border)] px-5 py-4">
              <Search className="size-4 text-[var(--text-faint)]" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Jump to anything..."
                className="flex-1 border-0 bg-transparent text-[18px] text-[var(--text)] outline-none placeholder:text-[var(--text-mute)]"
              />
              <span className="rounded-[7px] border border-[var(--border)] bg-[var(--bg-elev-2)] px-2 py-1 font-mono text-[10px] uppercase text-[var(--text-faint)]">
                esc
              </span>
            </div>

            <div className="max-h-[27rem] overflow-y-auto p-2">
              {filteredItems.length ? (
                filteredItems.map((item, index) => {
                  const Icon = item.icon
                  const active = index === activeIndex

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => {
                        setActiveIndex(index)
                        if (item.href) {
                          router.prefetch(item.href)
                        }
                      }}
                      onClick={() => navigate(item)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-4 rounded-[var(--radius-sm)] px-4 py-3 text-left transition-colors duration-150 ease-[var(--ease-signature)]",
                        active ? "bg-[var(--bg-elev-2)]" : "hover:bg-[var(--bg-elev-2)]",
                        index === 0 && "animate-rise-in"
                      )}
                    >
                      <span className="inline-flex size-8 items-center justify-center text-[var(--text-faint)]">
                        <Icon className="size-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-[15px] font-medium text-[var(--text)]">
                          {item.label}
                        </span>
                      </span>
                      <span className="text-[13px] text-[var(--text-faint)]">
                        {item.hint}
                        {item.shortcut ? <span className="ml-1">· ⌘{item.shortcut}</span> : null}
                      </span>
                    </button>
                  )
                })
              ) : (
                <div className="px-4 py-10 text-center text-sm text-[var(--text-dim)]">
                  No matches yet for <span className="text-[var(--text)]">{deferredQuery}</span>.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--text-faint)]">
              <span className="inline-flex items-center gap-3">
                <span>↑↓ navigate</span>
                <span className="inline-flex items-center gap-1">
                  <CornerDownLeft className="size-3" />
                  open
                </span>
                <span>esc close</span>
              </span>
              <span>{isPending ? "Opening..." : "Ready"}</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
