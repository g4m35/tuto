"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Bot, Brain, Library, MessageSquare, PenLine } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/Button"
import { CommandPalette } from "@/components/ui/CommandPalette"
import { cn } from "@/lib/utils"

const navItems = [
  { id: "chat", href: "/chat", label: "Chat", icon: MessageSquare },
  { id: "agents", href: "/agents", label: "Agents", icon: Bot },
  { id: "writer", href: "/co-writer", label: "Writer", icon: PenLine },
  { id: "book", href: "/book", label: "Book", icon: Library },
  { id: "memory", href: "/memory", label: "Memory", icon: Brain },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(20,17,14,0.85),rgba(20,17,14,0.72))] backdrop-blur-[14px]">
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-7">
        <div className="flex items-center gap-8">
          <Link
            href="/chat"
            className="[font-family:var(--font-serif)] text-[2rem] font-normal italic leading-none tracking-normal text-[var(--text)]"
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
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium text-[var(--text-faint)] transition-colors duration-200 ease-[var(--ease-signature)]",
                    active
                      ? "text-[var(--text)]"
                      : "hover:text-[var(--text-dim)]"
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
          <CommandPalette />
          <Button variant="secondary" size="sm" render={<Link href="/settings" />}>
            <BookOpen data-icon="inline-start" />
            Settings
          </Button>
          <div className="rounded-full border border-[var(--border)] bg-[var(--bg-elev)] p-1">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  )
}
