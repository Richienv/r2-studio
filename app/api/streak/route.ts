import { NextResponse } from "next/server";
import { computeStreak } from "@/lib/streak";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const streak = await computeStreak();
  const totalPosted = await db.reel.count({ where: { status: "posted" } });
  return NextResponse.json({
    streak,
    totalPosted,
    target: 365,
  });
}
