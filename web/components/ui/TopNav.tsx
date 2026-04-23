"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { UserButton } from "@clerk/nextjs"
import { Flame, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

const navItems = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard" },
  { id: "courses", href: "/dashboard#courses", label: "Courses" },
  { id: "create", href: "/create", label: "Create" },
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
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--bg)_86%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="serif text-3xl font-semibold italic tracking-tight text-[var(--text)]"
          >
            tuto.
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
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
                    "rounded-full px-4 py-2 text-sm font-medium text-[var(--text-dim)]",
                    active
                      ? "surface-panel text-[var(--text)]"
                      : "hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm text-[var(--text-dim)] sm:inline-flex">
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
