import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canAccessOperatorSettings } from "@/lib/admin-access";
import { getBetaSignupsCsv } from "@/lib/marketing-admin";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (!canAccessOperatorSettings(userId, user)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const csv = await getBetaSignupsCsv();

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tuto-beta-signups.csv"`,
    },
  });
}
