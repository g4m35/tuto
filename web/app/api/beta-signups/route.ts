import { NextResponse } from "next/server";
import { isBetaSignupSinkConfigured, recordBetaSignup } from "@/lib/marketing";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !isBetaSignupSinkConfigured()) {
    return NextResponse.json({ error: "beta_signup_sink_not_configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = readString(body.email).trim();
  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const result = await recordBetaSignup({
    email,
    name: readString(body.name),
    useCase: readString(body.useCase),
    materialType: readString(body.materialType),
    notes: readString(body.notes),
    marketingOptIn: Boolean(body.marketingOptIn),
    source: readString(body.source) || "landing_page",
    metadata: {
      page_url: readString(body.pageUrl),
      referrer: readString(body.referrer),
    },
  });

  if (!result.accepted) {
    return NextResponse.json({ error: "signup_not_accepted" }, { status: 400 });
  }

  return NextResponse.json(result, { status: 202 });
}
