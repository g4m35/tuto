import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createCheckoutSessionResult,
} from "@/lib/billing-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await createCheckoutSessionResult({
    request,
    userId,
    sessionClaims,
    payload,
  });

  return NextResponse.json(result.body, { status: result.status });
}
