"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Flame, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

const TopNavUserButton = dynamic(
  () => import("@/components/ui/TopNavUserButton").then((mod) => mod.TopNavUserButton),
  {
    ssr: false,
    loading: () => <div className="size-8 rounded-full bg-[var(--bg-soft)]" aria-hidden="true" />,
  }
)

const navItems = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard" },
  { id: "courses", href: "/dashboard#courses", label: "Courses" },
  { id: "create", href: "/create", label: "Create" },
  { id: "pricing", href: "/pricing", label: "Pricing" },
]

export function TopNav() {
  const pathname = usePathname()
  const [hash, setHash] = useState("")

  useEffect(() => {
    const syncHash = () => {
      setHash(window.location.hash)
    }

    syncHash()
    window.addEventListener("hashchange", syncHash)

    return () => {
      window.removeEventListener("hashchange", syncHash)
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)]/80 bg-[color:color-mix(in_srgb,var(--bg-elev)_82%,white)]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <Link
            href="/dashboard"
            className="shrink-0 text-[1.9rem] font-semibold tracking-tight text-[var(--text)]"
          >
            tuto.
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-elev)]/80 p-1 md:flex">
            {navItems.map((item) => {
              const active =
                item.id === "courses"
                  ? pathname === "/dashboard" && hash === "#courses"
                  : item.id === "dashboard"
                    ? pathname === "/dashboard" && hash !== "#courses"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--bg-soft)] text-[var(--text)] shadow-sm"
                      : "text-[var(--text-dim)] hover:text-[var(--text)]"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm text-[var(--text-dim)] lg:inline-flex">
            <Flame className="size-4 text-[var(--accent)]" />
            <span>12 day streak</span>
          </div>
          <Link href="/create" className="hidden sm:block">
            <Button size="sm" className="rounded-full px-3.5">
              <Plus data-icon="inline-start" />
              Create course
            </Button>
          </Link>
          <Link href="/create" className="sm:hidden">
            <Button size="icon-sm" className="rounded-full" aria-label="Create course">
              <Plus />
            </Button>
          </Link>
          <div className="rounded-full border border-[var(--border)] bg-[var(--bg-elev)] p-1 shadow-sm">
            <TopNavUserButton />
          </div>
        </div>

        <nav className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-[var(--border)] bg-[var(--bg-elev)]/80 p-1 md:hidden">
          {navItems.map((item) => {
            const active =
              item.id === "courses"
                ? pathname === "/dashboard" && hash === "#courses"
                : item.id === "dashboard"
                  ? pathname === "/dashboard" && hash !== "#courses"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={`mobile-${item.id}`}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--bg-soft)] text-[var(--text)] shadow-sm"
                    : "text-[var(--text-dim)] hover:text-[var(--text)]"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
