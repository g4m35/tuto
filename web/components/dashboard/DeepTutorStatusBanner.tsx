"use client";

import { useEffect, useState } from "react";

interface DeepTutorHealth {
  connected: boolean;
  latency_ms: number;
  version: string | null;
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

  if (process.env.NODE_ENV === "production" || !hasStubCourses) {
    return null;
  }

  return (
    <div className="rounded-[var(--radius-sm)] border border-amber-400/40 bg-amber-100/80 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium">
        Running in stub mode — connect DEEPTUTOR_URL for real content.
      </p>
      <p className="mt-1 text-amber-900/80">
        {!hasCheckedHealth
          ? "Checking DeepTutor connection status for this environment."
          : health?.connected
          ? `DeepTutor is reachable${health.version ? ` (v${health.version})` : ""} in ${health.latency_ms} ms. Existing stub courses will stay synthetic until regenerated.`
          : "DeepTutor health check is unavailable from the dashboard right now."}
      </p>
    </div>
  );
}
