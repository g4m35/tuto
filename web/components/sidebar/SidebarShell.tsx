"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { useAppShell } from "@/context/AppShellContext";
import {
  BookOpen,
  Bot,
  Brain,
  Library,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import SessionList from "@/components/SessionList";
import SidebarUserMenu from "@/components/auth/SidebarUserMenu";
import { TutorBotRecent } from "@/components/sidebar/TutorBotRecent";
import { BookRecent } from "@/components/sidebar/BookRecent";
import { CoWriterRecent } from "@/components/sidebar/CoWriterRecent";
import type { SessionSummary } from "@/lib/session-api";

interface NavEntry {
  href: string;
  label: string;
  icon: LucideIcon;
}

const PRIMARY_NAV: NavEntry[] = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/co-writer", label: "Writer", icon: PenLine },
  { href: "/book", label: "Book", icon: Library },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/memory", label: "Memory", icon: Brain },
];

const SECONDARY_NAV: NavEntry[] = [{ href: "/settings", label: "Settings", icon: Settings }];
const DEFAULT_SESSION_VIEWPORT_CLASS_NAME = "max-h-[112px]";

interface SidebarShellProps {
  sessions?: SessionSummary[];
  activeSessionId?: string | null;
  loadingSessions?: boolean;
  showSessions?: boolean;
  sessionViewportClassName?: string;
  onNewChat?: () => void;
  onSelectSession?: (sessionId: string) => void | Promise<void>;
  onRenameSession?: (sessionId: string, title: string) => void | Promise<void>;
  onDeleteSession?: (sessionId: string) => void | Promise<void>;
  footerSlot?: ReactNode;
}

export function SidebarShell({
  sessions = [],
  activeSessionId = null,
  loadingSessions = false,
  showSessions = false,
  sessionViewportClassName = DEFAULT_SESSION_VIEWPORT_CLASS_NAME,
  onNewChat,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  footerSlot,
}: SidebarShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useAppShell();

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
      return;
    }
    router.push("/chat");
  };

  /* ---- Collapsed state ---- */
  if (collapsed) {
    return (
      <aside className="group/sb relative flex h-screen w-16 shrink-0 flex-col items-center border-r border-[var(--border)] bg-[linear-gradient(180deg,rgba(17,17,17,0.82),rgba(10,10,10,0.72))] py-3 backdrop-blur-[14px] transition-[width] duration-300 ease-[var(--ease-signature)]">
        <div className="relative mb-2 flex h-9 w-9 items-center justify-center">
          <Link
            href="/chat"
            aria-label="Tuto"
            className="flex items-center justify-center transition-opacity duration-200 group-hover/sb:opacity-0"
          >
            <span className="[font-family:var(--font-serif)] text-[26px] font-normal italic leading-none tracking-normal text-[var(--text)]">
              t.
            </span>
          </Link>
          <button
            onClick={() => setCollapsed(false)}
            className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-faint)] opacity-0 transition-all duration-200 ease-[var(--ease-signature)] hover:bg-[var(--bg-elev-2)] hover:text-[var(--text)] group-hover/sb:opacity-100"
            aria-label={t("Expand sidebar")}
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>

        <button
          onClick={handleNewChat}
          title={t("New Chat") as string}
          className="t-btn mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elev-2)] text-[var(--text)] hover:border-[var(--border-strong)]"
          aria-label={t("New Chat")}
        >
          <Plus size={16} strokeWidth={2.2} />
        </button>

        <div className="my-1.5 h-px w-7 bg-[var(--border)]" />

        <nav className="flex w-full flex-col items-center gap-1 px-1.5">
          {PRIMARY_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={t(item.label) as string}
                className={`relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] transition-all duration-300 ease-[var(--ease-signature)] ${
                  active
                    ? "bg-[var(--bg-elev-2)] text-[var(--text)]"
                    : "text-[var(--text-faint)] hover:bg-[var(--bg-elev)] hover:text-[var(--text-dim)]"
                }`}
              >
                {active && (
                  <span className="absolute -left-1.5 top-1/2 h-5 w-px -translate-y-1/2 bg-[var(--accent)]" />
                )}
                <item.icon size={18} strokeWidth={active ? 2 : 1.6} />
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex w-full flex-col items-center gap-1 px-1.5">
          <div className="my-1 h-px w-7 bg-[var(--border)]" />
          <SidebarUserMenu compact />
          {SECONDARY_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={t(item.label) as string}
                className={`relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] transition-all duration-300 ease-[var(--ease-signature)] ${
                  active
                    ? "bg-[var(--bg-elev-2)] text-[var(--text)]"
                    : "text-[var(--text-faint)] hover:bg-[var(--bg-elev)] hover:text-[var(--text-dim)]"
                }`}
              >
                {active && (
                  <span className="absolute -left-1.5 top-1/2 h-5 w-px -translate-y-1/2 bg-[var(--accent)]" />
                )}
                <item.icon size={18} strokeWidth={active ? 2 : 1.6} />
              </Link>
            );
          })}
          {footerSlot}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-screen w-[248px] shrink-0 flex-col border-r border-[var(--border)] bg-[linear-gradient(180deg,rgba(17,17,17,0.86),rgba(10,10,10,0.76))] backdrop-blur-[14px] transition-[width] duration-300 ease-[var(--ease-signature)]">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/chat" className="group flex items-center">
          <span className="[font-family:var(--font-serif)] text-[34px] font-normal italic leading-none tracking-normal text-[var(--text)] transition-opacity duration-200 ease-[var(--ease-signature)] group-hover:opacity-80">
            tuto.
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <SidebarUserMenu />
          <button
            onClick={() => setCollapsed(true)}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-faint)] transition-all duration-200 ease-[var(--ease-signature)] hover:bg-[var(--bg-elev-2)] hover:text-[var(--text)]"
            aria-label={t("Collapse sidebar")}
          >
            <PanelLeftClose size={15} />
          </button>
        </div>
      </div>

      <nav className="px-2 pt-1">
        <div className="space-y-1">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text-dim)] transition-all duration-200 ease-[var(--ease-signature)] hover:bg-[var(--bg-elev)] hover:text-[var(--text)]"
          >
            <Plus size={16} strokeWidth={2} />
            <span>{t("New Chat")}</span>
          </button>

          {PRIMARY_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const hasSessionsBelow = item.href === "/chat" && showSessions && onSelectSession && onRenameSession && onDeleteSession;
            const hasBots = item.href === "/agents";
            const hasBooks = item.href === "/book";
            const hasCoWriterDocs = item.href === "/co-writer";
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] transition-all duration-300 ease-[var(--ease-signature)] ${
                    active
                      ? "bg-[var(--bg-elev-2)] text-[var(--text)]"
                      : "text-[var(--text-faint)] hover:bg-[var(--bg-elev)] hover:text-[var(--text-dim)]"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 bg-[var(--accent)]" />
                  )}
                  <item.icon size={16} strokeWidth={active ? 1.9 : 1.5} />
                  <span>{t(item.label)}</span>
                </Link>
                {hasSessionsBelow && (
                  <div className={`${sessionViewportClassName} overflow-y-auto`}>
                    <SessionList
                      sessions={sessions}
                      activeSessionId={activeSessionId}
                      loading={loadingSessions}
                      onSelect={onSelectSession}
                      onRename={onRenameSession}
                      onDelete={onDeleteSession}
                      compact
                    />
                  </div>
                )}
                {hasBots && <TutorBotRecent />}
                {hasCoWriterDocs && <CoWriterRecent />}
                {hasBooks && <BookRecent />}
              </div>
            );
          })}
        </div>
      </nav>

      <div className="flex-1" />

      <div className="border-t border-[var(--border)] px-2 py-2">
        {SECONDARY_NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] transition-all duration-300 ease-[var(--ease-signature)] ${
                active
                  ? "bg-[var(--bg-elev-2)] text-[var(--text)]"
                  : "text-[var(--text-faint)] hover:bg-[var(--bg-elev)] hover:text-[var(--text-dim)]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 bg-[var(--accent)]" />
              )}
              <item.icon size={16} strokeWidth={active ? 1.9 : 1.5} />
              <span>{t(item.label)}</span>
            </Link>
          );
        })}
        {footerSlot}
      </div>
    </aside>
  );
}
