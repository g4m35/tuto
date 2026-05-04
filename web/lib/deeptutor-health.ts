export interface DeepTutorHealth {
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

interface DeepTutorSystemStatus {
  guide?: { status?: unknown; error?: unknown };
  llm?: { status?: unknown };
  embeddings?: { status?: unknown };
}

function isConfiguredStatus(value: unknown) {
  return value === "configured";
}

function getDeepTutorUrl() {
  return process.env.DEEPTUTOR_URL?.replace(/\/$/, "") ?? "";
}

function getDeepTutorHeaders() {
  const apiKey = process.env.DEEPTUTOR_API_KEY;

  return {
    ...(apiKey ? { Authorization: `Bearer ${apiKey}`, "X-API-Key": apiKey } : {}),
  };
}

function isLocalStubFallbackEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEEPTUTOR_DISABLE_LOCAL_STUB_FALLBACK !== "true"
  );
}

function buildHealth(input: {
  connected: boolean;
  latency_ms: number;
  version: string | null;
  guide_configured: boolean;
  llm_configured: boolean;
  embeddings_configured: boolean;
  reason?: string;
}): DeepTutorHealth {
  const deeptutorUrlConfigured = Boolean(getDeepTutorUrl());
  const localStubFallbackEnabled = isLocalStubFallbackEnabled();
  const liveReady =
    input.connected &&
    input.guide_configured &&
    input.llm_configured &&
    input.embeddings_configured;

  return {
    ...input,
    deeptutor_url_configured: deeptutorUrlConfigured,
    local_stub_fallback_enabled: localStubFallbackEnabled,
    generation_mode: liveReady
      ? "live"
      : localStubFallbackEnabled
        ? "fallback_possible"
        : "stub",
    reason:
      input.reason ??
      (liveReady
        ? "DeepTutor is reachable and fully configured."
        : localStubFallbackEnabled
          ? "Local fallback is enabled, so generation can return stub artifacts if DeepTutor is unreachable or incomplete."
          : "DeepTutor is not fully available and local fallback is disabled."),
  };
}

export async function getDeepTutorHealth(): Promise<DeepTutorHealth> {
  const baseUrl = getDeepTutorUrl();

  if (!baseUrl) {
    return buildHealth({
      connected: false,
      latency_ms: 0,
      version: null,
      guide_configured: false,
      llm_configured: false,
      embeddings_configured: false,
      reason: "DEEPTUTOR_URL is not configured.",
    });
  }

  const startedAt = performance.now();
  const signal = AbortSignal.timeout(5_000);
  const headers = getDeepTutorHeaders();

  try {
    const versionPromise = fetch(`${baseUrl}/openapi.json`, {
      cache: "no-store",
      headers,
      signal,
    }).catch(() => null);
    const statusResponse = await fetch(`${baseUrl}/api/v1/system/status`, {
      cache: "no-store",
      headers,
      signal,
    });
    const latencyMs = Math.round(performance.now() - startedAt);

    if (!statusResponse.ok) {
      return buildHealth({
        connected: false,
        latency_ms: latencyMs,
        version: null,
        guide_configured: false,
        llm_configured: false,
        embeddings_configured: false,
        reason: `DeepTutor status returned HTTP ${statusResponse.status}.`,
      });
    }

    let version: string | null = null;
    let guideConfigured = false;
    let llmConfigured = false;
    let embeddingsConfigured = false;

    try {
      const status = (await statusResponse.json()) as DeepTutorSystemStatus;
      guideConfigured = isConfiguredStatus(status.guide?.status);
      llmConfigured = isConfiguredStatus(status.llm?.status);
      embeddingsConfigured = isConfiguredStatus(status.embeddings?.status);
    } catch {
      guideConfigured = false;
      llmConfigured = false;
      embeddingsConfigured = false;
    }

    try {
      const versionResponse = await versionPromise;

      if (versionResponse?.ok) {
        const openApi = (await versionResponse.json()) as {
          info?: { version?: unknown };
        };

        version = typeof openApi.info?.version === "string" ? openApi.info.version : null;
      }
    } catch {
      version = null;
    }

    return buildHealth({
      connected: true,
      latency_ms: latencyMs,
      version,
      guide_configured: guideConfigured,
      llm_configured: llmConfigured,
      embeddings_configured: embeddingsConfigured,
    });
  } catch {
    return buildHealth({
      connected: false,
      latency_ms: Math.round(performance.now() - startedAt),
      version: null,
      guide_configured: false,
      llm_configured: false,
      embeddings_configured: false,
      reason: "DeepTutor did not respond before the health-check timeout.",
    });
  }
}
