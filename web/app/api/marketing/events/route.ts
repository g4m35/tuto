import { NextResponse } from "next/server";
import { captureMarketingEvent } from "@/lib/marketing";

export const runtime = "nodejs";

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readProperties(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = readString(body.name).trim();
  const distinctId = readString(body.distinctId).trim();

  if (!name || !distinctId) {
    return NextResponse.json({ error: "missing_event_fields" }, { status: 400 });
  }

  const result = await captureMarketingEvent({
    name,
    distinctId,
    userId: readString(body.userId).trim() || null,
    source: readString(body.source).trim() || "web",
    url: readString(body.url).trim() || null,
    referrer: readString(body.referrer).trim() || null,
    properties: readProperties(body.properties),
  });

  return NextResponse.json(result);
}
