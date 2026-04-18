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
  hasStubCourses,
}: DeepTutorStatusBannerProps) {
  const [health, setHealth] = useState<DeepTutorHealth | null>(null);
  const [hasCheckedHealth, setHasCheckedHealth] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHealth() {
      try {
        const response = await fetch("/api/health/deeptutor", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const nextHealth = (await response.json()) as DeepTutorHealth;
        setHealth(nextHealth);
      } catch {
        // Keep the banner copy stable if the health check fails.
      } finally {
        setHasCheckedHealth(true);
      }
    }

    void loadHealth();

    return () => {
      controller.abort();
    };
  }, []);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (!hasStubCourses && !hasCheckedHealth) {
    return null;
  }

  if (!hasStubCourses && hasCheckedHealth && health?.connected && health.embeddings_configured) {
    return null;
  }

  const isBackendWarning = hasCheckedHealth && health?.connected !== true;
  const isEmbeddingWarning =
    hasCheckedHealth && health?.connected === true && !health.embeddings_configured;
  const title = isBackendWarning
    ? "DeepTutor backend not connected."
    : isEmbeddingWarning
    ? "DeepTutor embeddings not configured."
    : "Running in stub mode — connect DEEPTUTOR_URL for real content.";
  const body = !hasCheckedHealth
    ? "Checking DeepTutor connection status for this environment."
    : isBackendWarning
    ? "The dashboard cannot reach DeepTutor right now, so live course generation and health checks are unavailable."
    : isEmbeddingWarning
    ? `DeepTutor is reachable${health?.version ? ` (v${health.version})` : ""} in ${health?.latency_ms ?? 0} ms, but embeddings are still disabled. Topic generation can work while upload and retrieval flows remain limited.`
    : health?.connected
    ? `DeepTutor is reachable${health.version ? ` (v${health.version})` : ""} in ${health.latency_ms} ms. Existing stub courses will stay synthetic until regenerated.`
    : "DeepTutor health check is unavailable from the dashboard right now.";
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
