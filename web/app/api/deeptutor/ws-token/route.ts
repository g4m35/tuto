import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createDeepTutorWsToken } from "@/lib/deeptutor-ws-token";
import { getDeepTutorUrl } from "@/lib/deeptutor-config";

export const runtime = "nodejs";

function toWsUrl(baseUrl: string, path: string, token: string) {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, `${baseUrl}/`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("dt_ws_token", token);
  return url.toString();
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const baseUrl = getDeepTutorUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "deeptutor_not_configured" }, { status: 503 });
  }

  const path = new URL(request.url).searchParams.get("path");
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid WebSocket path." }, { status: 400 });
  }

  const token = createDeepTutorWsToken({ path, clerkId: userId });
  return NextResponse.json({ url: toWsUrl(baseUrl, path, token) });
}
