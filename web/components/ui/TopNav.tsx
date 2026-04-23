"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { UserButton } from "@clerk/nextjs"
import { BookOpen, Flame, LayoutGrid, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

const navItems = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "courses", href: "/dashboard#courses", label: "Courses", icon: BookOpen },
  { id: "create", href: "/create", label: "Create", icon: Sparkles },
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
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="[font-family:var(--font-serif)] text-[1.95rem] font-medium italic tracking-tight text-[var(--text)]"
          >
            tuto.
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const active =
                item.id === "courses"
                  ? pathname.startsWith("/courses") || (pathname === "/dashboard" && hash === "#courses")
                  : item.id === "dashboard"
                    ? pathname === "/dashboard" && hash !== "#courses"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    if (item.id === "courses") {
                      setHash("#courses")
                    } else if (item.id === "dashboard") {
                      setHash("")
                    }
                  }}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.83rem] font-medium text-[var(--text-dim)]",
                    active
                      ? "text-[var(--text)]"
                      : "hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                  {active ? (
                    <span className="absolute inset-x-3.5 bottom-1 h-px bg-[var(--accent)]/85" />
                  ) : null}
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
          <Button variant="secondary" size="sm" render={<Link href="/pricing" />}>
            <Sparkles data-icon="inline-start" />
            Upgrade
          </Button>
          <div className="rounded-full border border-[var(--border)] bg-[var(--bg-elev)] p-1">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  )
}
