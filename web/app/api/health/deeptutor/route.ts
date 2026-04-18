import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface DeepTutorSystemStatus {
  llm?: { status?: unknown };
  embeddings?: { status?: unknown };
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

export async function GET() {
  const baseUrl = getDeepTutorUrl();

  if (!baseUrl) {
    return NextResponse.json({
      connected: false,
      latency_ms: 0,
      version: null,
      llm_configured: false,
      embeddings_configured: false,
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
    });
    const statusResponse = await fetch(`${baseUrl}/api/v1/system/status`, {
      cache: "no-store",
      headers,
      signal,
    });
    const latencyMs = Math.round(performance.now() - startedAt);

    if (!statusResponse.ok) {
      return NextResponse.json({
        connected: false,
        latency_ms: latencyMs,
        version: null,
        llm_configured: false,
        embeddings_configured: false,
      });
    }

    let version: string | null = null;
    let llmConfigured = false;
    let embeddingsConfigured = false;

    try {
      const status = (await statusResponse.json()) as DeepTutorSystemStatus;
      llmConfigured = status.llm?.status === "configured";
      embeddingsConfigured = status.embeddings?.status === "configured";
    } catch {
      llmConfigured = false;
      embeddingsConfigured = false;
    }

    try {
      const versionResponse = await versionPromise;

      if (versionResponse.ok) {
        const openApi = (await versionResponse.json()) as {
          info?: { version?: unknown };
        };

        version = typeof openApi.info?.version === "string" ? openApi.info.version : null;
      }
    } catch {
      version = null;
    }

    return NextResponse.json({
      connected: true,
      latency_ms: latencyMs,
      version,
      llm_configured: llmConfigured,
      embeddings_configured: embeddingsConfigured,
    });
  } catch {
    return NextResponse.json({
      connected: false,
      latency_ms: Math.round(performance.now() - startedAt),
      version: null,
      llm_configured: false,
      embeddings_configured: false,
    });
  }
}
