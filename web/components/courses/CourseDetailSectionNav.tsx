"use client";

import { useEffect, useState } from "react";
import { BookOpen, Compass, Layers3, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionLink {
  id: string;
  label: string;
}

const ICONS: Record<string, LucideIcon> = {
  overview: Compass,
  path: Layers3,
  materials: BookOpen,
};

interface CourseDetailSectionNavProps {
  items: SectionLink[];
  mobile?: boolean;
}

export function CourseDetailSectionNav({
  items,
  mobile = false,
}: CourseDetailSectionNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "overview");

  useEffect(() => {
    const sections = items
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
  }, [items]);

  if (mobile) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:hidden">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition-colors duration-200",
              activeId === item.id
                ? "bg-[var(--text)] text-white"
                : "border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-dim)] hover:text-[var(--text)]",
            )}
          >
            {item.label}
          </a>
        ))}
      </div>
    );
  }

  return (
    <nav className="mt-4 space-y-1.5">
      {items.map((item) => {
        const Icon = ICONS[item.id] ?? Compass;
        const active = activeId === item.id;

        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors duration-200",
              active
                ? "bg-[var(--bg-soft)] font-medium text-[var(--text)]"
                : "text-[var(--text-dim)] hover:bg-[var(--bg-soft)]/80 hover:text-[var(--text)]",
            )}
          >
            <span
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-2xl",
                active
                  ? "bg-[var(--bg-elev)] text-[var(--accent)] shadow-sm"
                  : "bg-[var(--bg-elev)]/55 text-[var(--text-faint)]",
              )}
            >
              <Icon className="size-4" />
            </span>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
