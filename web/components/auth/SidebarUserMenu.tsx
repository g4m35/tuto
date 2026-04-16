"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

interface SidebarUserMenuProps {
  compact?: boolean;
}

export default function SidebarUserMenu({ compact = false }: SidebarUserMenuProps) {
  if (compact) {
    return (
      <>
        <Show when="signed-in">
          <div className="flex items-center justify-center">
            <UserButton />
          </div>
        </Show>
        <Show when="signed-out">
          <Link
            href="/sign-in"
            className="rounded-lg border border-[var(--border)]/60 px-2 py-1 text-[12px] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--background)]/50 hover:text-[var(--foreground)]"
          >
            Sign in
          </Link>
        </Show>
      </>
    );
  }

  return (
    <>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--background)]/50 hover:text-[var(--foreground)]"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-[var(--foreground)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--background)] transition-colors hover:opacity-90"
          >
            Sign up
          </Link>
        </div>
      </Show>
    </>
  );
}
