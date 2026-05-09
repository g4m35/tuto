"use client";

import { useEffect, useState } from "react";

interface DeepTutorHealth {
  connected: boolean;
  latency_ms: number;
  version: string | null;
  guide_configured: boolean;
  llm_configured: boolean;
  embeddings_configured: boolean;
  deeptutor_url_configured: boolean;
  local_stub_fallback_enabled: boolean;
  generation_mode: "live" | "stub" | "fallback_possible";
  reason: string;
}

interface DeepTutorStatusBannerProps {
  hasStubCourses: boolean;
}

export function DeepTutorStatusBanner({
  hasStubCourses,
}: DeepTutorStatusBannerProps) {
  const [health, setHealth] = useState<DeepTutorHealth | null>(null);
  const [hasCheckedHealth, setHasCheckedHealth] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number | null = null;
    let cancelled = false;

    async function loadHealth(attempt = 0) {
      try {
        const response = await fetch("/api/health/deeptutor", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          if (!cancelled && attempt < 5) {
            timeoutId = window.setTimeout(() => {
              void loadHealth(attempt + 1);
            }, 2_000);
          }
          return;
        }

        const nextHealth = (await response.json()) as DeepTutorHealth;
        setHealth(nextHealth);

        if (!nextHealth.connected && !cancelled && attempt < 5) {
          timeoutId = window.setTimeout(() => {
            void loadHealth(attempt + 1);
          }, 2_000);
        }
      } catch {
        if (!cancelled && attempt < 5) {
          timeoutId = window.setTimeout(() => {
            void loadHealth(attempt + 1);
          }, 2_000);
        }
      } finally {
        setHasCheckedHealth(true);
      }
    }

    void loadHealth();

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      controller.abort();
    };
  }, []);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (!hasCheckedHealth) {
    return null;
  }

  const isBackendWarning = hasCheckedHealth && health?.connected !== true;
  const isGuideWarning =
    hasCheckedHealth && health?.connected === true && !health.guide_configured;
  const isEmbeddingWarning =
    hasCheckedHealth && health?.connected === true && !health.embeddings_configured;

  if (!isBackendWarning && !isGuideWarning && !isEmbeddingWarning && !hasStubCourses) {
    return null;
  }

  const title = hasStubCourses
    ? "Local stub courses in this workspace"
    : isBackendWarning
      ? "DeepTutor backend offline"
      : isGuideWarning
        ? "DeepTutor course generation incomplete"
        : "Document uploads limited: embeddings not configured";
  const body = hasStubCourses
    ? "Local stub mode created some artifacts. Start DeepTutor to match production."
    : isBackendWarning
      ? health?.reason || "DeepTutor is offline. Live generation is unavailable."
      : isGuideWarning
        ? "DeepTutor is online, but course generation is not configured."
        : `DeepTutor is online${health?.version ? ` (v${health.version})` : ""}; embeddings are disabled. Upload and retrieval are limited.`;
  const bodyClasses = "text-[var(--text-dim)]";

  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-3 text-sm text-[var(--text)]">
      <p className="font-medium">{title}</p>
      <p className={`mt-1 ${bodyClasses}`}>{body}</p>
    </div>
  );
}
