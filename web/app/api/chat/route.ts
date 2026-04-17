import { NextResponse } from "next/server";
import { recordUsage } from "@/lib/usage";
import { withUsageLimit } from "@/lib/withUsageLimit";

export const runtime = "nodejs";

export const POST = withUsageLimit("message", async (_request, { clerkId }) => {
  await recordUsage(clerkId, "message");

  return NextResponse.json({ ok: true });
});
