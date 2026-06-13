import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, addDays } from "@/lib/dates";
import { computeStreak, computeCurrentDayNumber } from "@/lib/streak";

export const dynamic = "force-dynamic";

export async function GET() {
  const day = await computeCurrentDayNumber();
  const streak = await computeStreak();

  const today = new Date();
  const weekEnd = addDays(today, 7);
  const pending = await db.reel.count({
    where: {
      status: { in: ["idea", "scripted", "filmed"] },
      scheduledDate: {
        gte: startOfDay(today),
        lte: endOfDay(weekEnd),
      },
    },
  });

  const todaysReel = await db.reel.findFirst({
    where: {
      scheduledDate: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    include: { pillar: true },
    orderBy: { dayNumber: "asc" },
  });

  let highlight: string | null = null;
  if (todaysReel?.pillar && todaysReel.hook) {
    const hook = todaysReel.hook.slice(0, 30);
    highlight = `FILMING: ${todaysReel.pillar.name} · ${hook}${todaysReel.hook.length > 30 ? "…" : ""}`;
  } else if (todaysReel?.pillar) {
    highlight = `FILMING: ${todaysReel.pillar.name}`;
  }

  // Trend: streak vs streak as of yesterday
  const lastPosted = await db.reel.findFirst({
    where: { status: "posted" },
    orderBy: { postedAt: "desc" },
    select: { postedAt: true },
  });
  let trend: "up" | "down" | "flat" = "flat";
  if (lastPosted?.postedAt) {
    const posted = startOfDay(lastPosted.postedAt).getTime();
    const todayMs = startOfDay(today).getTime();
    trend = posted === todayMs ? "up" : posted === addDays(today, -1).getTime() ? "flat" : "down";
  }

  return NextResponse.json({
    metric: `${day}/365`,
    unit: "DAYS",
    label: `DAY ${day} · STREAK ${streak} · ${pending} PENDING`,
    highlight,
    trend,
    lastUpdated: new Date().toISOString(),
  });
}
