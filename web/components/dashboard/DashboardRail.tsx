"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, Compass, FolderKanban, Sparkles, Target } from "lucide-react";

const railItems = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "focus", label: "Focus", icon: Target },
  { id: "courses", label: "Courses", icon: BookOpen },
];

interface DashboardRailProps {
  hasCourses: boolean;
}

export function DashboardRail({ hasCourses }: DashboardRailProps) {
  const [activeId, setActiveId] = useState("overview");

  useEffect(() => {
    const sections = railItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    const syncFromHash = () => {
      const next = window.location.hash.replace("#", "");
      if (next) {
        setActiveId(next);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    if (!sections.length) {
      return () => {
        window.removeEventListener("hashchange", syncFromHash);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.2, 0.45, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      observer.disconnect();
    };
  }, []);

  return (
    <aside className="surface-card hidden h-fit flex-col rounded-[30px] p-4 xl:sticky xl:top-24 xl:flex">
      <div className="border-b border-[var(--border)] px-2 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
          Learning space
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">
          tuto.
        </h2>
      </div>

      <nav className="mt-4 space-y-1.5">
        {railItems.map((item) => {
          const Icon = item.icon;
          const active = activeId === item.id;

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors ${
                active
                  ? "bg-[var(--bg-soft)] font-medium text-[var(--text)]"
                  : "text-[var(--text-dim)] hover:bg-[var(--bg-soft)]/80 hover:text-[var(--text)]"
              }`}
            >
              <span
                className={`inline-flex size-9 items-center justify-center rounded-2xl ${
                  active
                    ? "bg-[var(--bg-elev)] text-[var(--accent)] shadow-sm"
                    : "bg-[var(--bg-elev)]/55 text-[var(--text-faint)]"
                }`}
              >
                <Icon className="size-4" />
              </span>
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)]/78 p-4">
        <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--bg-elev)] text-[var(--accent)] shadow-sm">
          <Sparkles className="size-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-[var(--text)]">
          {hasCourses ? "Keep the loop moving" : "Start your first path"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
          {hasCourses
            ? "Resume a course, review the weak spot, and let the dashboard stay quiet everywhere else."
            : "Create one course and this dashboard will reorganize around your next lesson automatically."}
        </p>
        <Link
          href="/create"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]"
        >
          Create course
          <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="mt-auto flex items-center justify-between px-2 pt-6 text-xs text-[var(--text-faint)]">
        <span className="inline-flex items-center gap-2">
          <FolderKanban className="size-3.5" />
          Workspace v1.4
        </span>
        <span>system.com</span>
      </div>
    </aside>
  );
}
