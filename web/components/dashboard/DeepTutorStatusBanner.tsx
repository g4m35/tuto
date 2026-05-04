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
    ? "At least one saved artifact was generated with localhost stub mode. Start the DeepTutor backend and set DEEPTUTOR_DISABLE_LOCAL_STUB_FALLBACK=true if you want local failures to match production."
    : isBackendWarning
      ? health?.reason || "The dashboard cannot reach DeepTutor right now, so live generation is unavailable."
      : isGuideWarning
        ? "DeepTutor is reachable, but guided course generation is not configured yet."
        : `DeepTutor is reachable${health?.version ? ` (v${health.version})` : ""} in ${health?.latency_ms ?? 0} ms, but embeddings are still disabled. Chat can keep working, while document upload and retrieval flows remain limited.`;
  const bodyClasses = "text-[var(--text-dim)]";

  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-3 text-sm text-[var(--text)]">
      <p className="font-medium">{title}</p>
      <p className={`mt-1 ${bodyClasses}`}>{body}</p>
    </div>
  );
}
