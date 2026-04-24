// Browser-safe helpers for the DeepTutor backend.
//
// HTTP and SSE traffic goes through a same-origin Next.js proxy so Clerk auth,
// quotas, and the server-only DeepTutor API key are applied before forwarding.
// WebSockets use a short-lived signed URL minted by that same Next.js app.

interface DeepTutorWsTokenResponse {
  url?: string;
  error?: string;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Construct a same-origin proxy URL for the DeepTutor API.
 * @param path - Backend path (for example, '/api/v1/knowledge/list')
 */
export function apiUrl(path: string): string {
  return `/api/deeptutor${normalizePath(path)}`;
}

/**
 * Mint a short-lived authenticated backend WebSocket URL.
 * @param path - Backend WebSocket path (for example, '/api/v1/ws')
 */
export async function wsUrl(path: string): Promise<string> {
  const response = await fetch(
    `/api/deeptutor/ws-token?path=${encodeURIComponent(normalizePath(path))}`,
    { cache: "no-store" },
  );

  const data = (await response.json().catch(() => ({}))) as DeepTutorWsTokenResponse;
  if (!response.ok || !data.url) {
    throw new Error(data.error || "Unable to open an authenticated DeepTutor WebSocket.");
  }

  return data.url;
}
