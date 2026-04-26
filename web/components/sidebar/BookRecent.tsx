"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

interface RecentBook {
  id: string;
  title: string;
  status: string;
  chapter_count: number;
  page_count: number;
  updated_at: number;
}

const STATUS_DOT: Record<string, string> = {
  ready: "bg-[var(--text-dim)]",
  partial: "bg-[var(--text-faint)]",
  generating: "bg-[var(--accent)]",
  planning: "bg-[var(--accent)]",
  pending: "bg-[var(--text-faint)]",
  draft: "bg-[var(--text-faint)]",
  spine_ready: "bg-[var(--text-dim)]",
  error: "bg-[var(--text-faint)]",
};

function relativeTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return "";
  const diff = Date.now() / 1000 - seconds;
  if (diff < 60) return "now";
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

interface BookRecentProps {
  collapsed?: boolean;
  limit?: number;
}

export function BookRecent({ collapsed = false, limit = 4 }: BookRecentProps) {
  const [books, setBooks] = useState<RecentBook[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/v1/book/books"));
        if (!res.ok) return;
        const data = await res.json();
        const items: RecentBook[] = Array.isArray(data?.books) ? data.books : [];
        items.sort(
          (a, b) => (Number(b.updated_at) || 0) - (Number(a.updated_at) || 0),
        );
        if (!cancelled) setBooks(items.slice(0, limit));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (books.length === 0) return null;

  if (collapsed) return null;

  return (
    <div className="ml-5 border-l border-[var(--border)]/30 py-1">
      {books.map((book) => {
        const dot = STATUS_DOT[book.status] || "bg-[var(--text-faint)]";
        return (
          <Link
            key={book.id}
            href={`/book?book=${encodeURIComponent(book.id)}`}
            className="group flex items-center gap-2 rounded-r-[var(--radius-sm)] py-1 pl-3 pr-2 text-[var(--text-faint)] transition-colors duration-200 ease-[var(--ease-signature)] hover:bg-[var(--bg-elev)] hover:text-[var(--text-dim)]"
          >
            <span className={`block h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span className="min-w-0 flex-1 truncate text-[13px]">
              {book.title || "Untitled book"}
            </span>
            <span className="shrink-0 text-[10px] tabular-nums text-[var(--text-faint)]">
              {relativeTime(Number(book.updated_at) || 0)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
