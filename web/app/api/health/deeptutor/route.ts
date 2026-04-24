import { NextResponse } from "next/server";
import { getDeepTutorHealth } from "@/lib/deeptutor-health";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getDeepTutorHealth());
}
