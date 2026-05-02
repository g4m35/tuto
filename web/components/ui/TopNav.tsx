"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { BookOpen, CreditCard, Grid2x2 } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { CommandPalette } from "@/components/ui/CommandPalette"
import { cn } from "@/lib/utils"

const navItems = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: Grid2x2 },
  { id: "courses", href: "/courses", label: "Library", icon: BookOpen },
  { id: "billing", href: "/account", label: "Billing", icon: CreditCard },
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
    <header className="sticky top-0 z-40 h-16 border-b border-[var(--border)] bg-white/88 backdrop-blur-[18px]">
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
                    "relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-[14px] font-medium text-[var(--text-faint)] transition-colors duration-150 ease-[var(--ease-signature)]",
                    active
                      ? "bg-[var(--bg-soft)] text-[var(--text)]"
                      : "hover:bg-[var(--bg-elev-2)] hover:text-[var(--text-dim)]"
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                  {active ? (
                    <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-[var(--accent-strong)]" />
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
