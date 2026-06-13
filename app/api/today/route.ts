import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "@/lib/dates";
import { computeStreak, computeCurrentDayNumber } from "@/lib/streak";
import { serializeReel } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  const filming = await db.reel.findMany({
    where: {
      scheduledDate: { gte: start, lte: end },
      status: { in: ["idea", "scripted", "filmed"] },
    },
    include: { pillar: true },
    orderBy: { dayNumber: "asc" },
  });

  const posting = await db.reel.findMany({
    where: {
      scheduledDate: { gte: start, lte: end },
      status: "edited",
    },
    include: { pillar: true },
    orderBy: { dayNumber: "asc" },
  });

  const streak = await computeStreak();
  const day = await computeCurrentDayNumber();

  return NextResponse.json({
    day,
    streak,
    date: start.toISOString(),
    filming: filming.map(serializeReel),
    posting: posting.map(serializeReel),
  });
}
