"use client";

import { useEffect, useState } from "react";

interface DeepTutorHealth {
  connected: boolean;
  latency_ms: number;
  version: string | null;
  llm_configured: boolean;
  embeddings_configured: boolean;
}

interface DeepTutorStatusBannerProps {
  hasStubCourses: boolean;
}

export function DeepTutorStatusBanner({
  hasStubCourses: _hasStubCourses,
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
  const isEmbeddingWarning =
    hasCheckedHealth && health?.connected === true && !health.embeddings_configured;

  if (!isBackendWarning && !isEmbeddingWarning) {
    return null;
  }

  const title = isBackendWarning
    ? "DeepTutor backend offline"
    : "Document uploads limited: embeddings not configured";
  const body = isBackendWarning
    ? "The dashboard cannot reach DeepTutor right now, so live course generation and health checks are unavailable."
    : `DeepTutor is reachable${health?.version ? ` (v${health.version})` : ""} in ${health?.latency_ms ?? 0} ms, but embeddings are still disabled. Chat can keep working, while document upload and retrieval flows remain limited.`;
  const toneClasses = isBackendWarning
    ? "border-rose-400/40 bg-rose-100/80 text-rose-950"
    : "border-amber-400/40 bg-amber-100/80 text-amber-950";
  const bodyClasses = isBackendWarning ? "text-rose-900/80" : "text-amber-900/80";

  return (
    <div className={`rounded-[var(--radius-sm)] border px-4 py-3 text-sm ${toneClasses}`}>
      <p className="font-medium">{title}</p>
      <p className={`mt-1 ${bodyClasses}`}>{body}</p>
    </div>
  );
}
