import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canAccessOperatorSettings } from "@/lib/admin-access";
import { getDeepTutorAuthHeaders, getDeepTutorUrl } from "@/lib/deeptutor-config";

export const runtime = "nodejs";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function copyRequestHeaders(request: Request) {
  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }
  for (const [key, value] of Object.entries(getDeepTutorAuthHeaders())) {
    headers.set(key, value);
  }
  return headers;
}

function copyResponseHeaders(response: Response) {
  const headers = new Headers();
  for (const [key, value] of response.headers) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }
  return headers;
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;
  const targetPath = path.join("/");
  if (targetPath.startsWith("api/v1/settings")) {
    const user = await currentUser();
    if (!canAccessOperatorSettings(userId, user)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const baseUrl = getDeepTutorUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "deeptutor_not_configured" }, { status: 503 });
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`/${path.join("/")}${incomingUrl.search}`, `${baseUrl}/`);
  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      ...Object.fromEntries(copyRequestHeaders(request)),
      "X-Clerk-User-Id": userId,
    },
    body,
    redirect: "manual",
    cache: "no-store",
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: copyResponseHeaders(response),
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
