"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackMarketingEvent } from "@/lib/marketing-client";
import { cn } from "@/lib/utils";

type MarketingNavId = "product" | "samples" | "use-cases" | "enterprise" | "pricing";

interface MarketingHeaderProps {
  active?: MarketingNavId;
  anchorBase?: "" | "/";
  eventSource: string;
  primaryHref?: string;
  primaryLabel?: string;
  primaryEventName?: string;
  primaryEventProps?: Record<string, string>;
}

const navItems: Array<{ id: MarketingNavId; label: string; href: string }> = [
  { id: "product", label: "Product", href: "#product" },
  { id: "samples", label: "Samples", href: "/sample-courses" },
  { id: "use-cases", label: "Use cases", href: "#use-cases" },
  { id: "enterprise", label: "Enterprise", href: "#enterprise" },
  { id: "pricing", label: "Pricing", href: "#pricing" },
];

function LogoMark() {
  return (
    <span
      className="[font-family:var(--font-serif)] text-[34px] font-normal italic leading-none tracking-normal text-[#102a43]"
      aria-label="Tuto"
    >
      tuto.
    </span>
  );
}

export function MarketingHeader({
  active,
  anchorBase = "",
  eventSource,
  primaryHref = "/create",
  primaryLabel = "Create course",
  primaryEventName = "hero_create_course_clicked",
  primaryEventProps,
}: MarketingHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#d9e8e4]/80 bg-[#fbfffd]/[0.9] backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-7">
        <Link href="/" onClick={() => trackMarketingEvent("nav_logo_clicked", { source: eventSource })}>
          <LogoMark />
        </Link>

        <div className="hidden items-center gap-7 text-[14px] font-medium text-[#486581] lg:flex">
          {navItems.map((item) => {
            const href = item.href.startsWith("#") ? `${anchorBase}${item.href}` : item.href;
            const isActive = active === item.id;

            return (
              <Link
                key={item.id}
                href={href}
                onClick={() =>
                  trackMarketingEvent("marketing_nav_clicked", {
                    source: eventSource,
                    location: "nav",
                    section: item.id,
                  })
                }
                className={cn(
                  "rounded-full px-1 py-2 transition-colors hover:text-[#102a43]",
                  isActive && "font-semibold text-[#102a43]",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            onClick={() => trackMarketingEvent("hero_open_app_clicked", { source: eventSource, location: "nav" })}
            className="hidden h-9 items-center rounded-full px-4 text-[14px] font-semibold text-[#486581] transition-colors hover:text-[#102a43] sm:inline-flex"
          >
            Open app
          </Link>
          <Link
            href={primaryHref}
            onClick={() =>
              trackMarketingEvent(primaryEventName, {
                source: eventSource,
                location: "nav",
                ...primaryEventProps,
              })
            }
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#102a43] px-4 text-[14px] font-semibold text-white shadow-[0_12px_24px_-18px_rgba(16,42,67,0.7)] transition-colors hover:bg-[#243b53]"
          >
            {primaryLabel}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
