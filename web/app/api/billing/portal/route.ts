import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createBillingPortalResult } from "@/lib/billing-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await createBillingPortalResult({
    request,
    userId,
  });

  return NextResponse.json(result.body, { status: result.status });
}
