import { NextResponse } from "next/server";
import { withUsageLimit } from "@/lib/withUsageLimit";

export const runtime = "nodejs";

export const POST = withUsageLimit("message", async () => {
  return NextResponse.json({ ok: true });
});
