"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { BookOpen, Braces, Grid2x2, Sparkles } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { CommandPalette } from "@/components/ui/CommandPalette"
import { cn } from "@/lib/utils"

const navItems = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: Grid2x2 },
  { id: "courses", href: "/courses", label: "Courses", icon: BookOpen },
  { id: "create", href: "/create", label: "Create", icon: Sparkles },
  { id: "review", href: "/review", label: "Review", icon: Braces },
]

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    for (const item of navItems) {
      router.prefetch(item.href)
    }
    router.prefetch("/account")
  }, [router])

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(10,10,10,0.92),rgba(0,0,0,0.74))] backdrop-blur-[18px]">
      <div className="mx-auto flex h-full w-full max-w-[1408px] items-center justify-between gap-4 px-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-10">
          <Link
            href="/dashboard"
            className="[font-family:var(--font-serif)] text-[32px] font-normal italic leading-none tracking-normal text-[var(--text)] transition-opacity duration-200 ease-[var(--ease-signature)] hover:opacity-80"
          >
            tuto.
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch
                  onMouseEnter={() => router.prefetch(item.href)}
                  className={cn(
                    "relative inline-flex h-10 cursor-pointer items-center gap-2 px-2.5 text-[14px] font-medium text-[var(--text-faint)] transition-colors duration-150 ease-[var(--ease-signature)]",
                    active
                      ? "text-[var(--text)]"
                      : "hover:text-[var(--text-dim)]"
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                  {active ? (
                    <span className="absolute inset-x-2.5 bottom-0 h-px bg-[var(--accent)]/85" />
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CommandPalette />
          <div className="rounded-full border border-[var(--border)] bg-[var(--bg-elev)] p-1">
            <UserButton
              userProfileMode="navigation"
              userProfileUrl="/account"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
