import { db } from "./db";
import { startOfDay, addDays } from "./dates";

export async function computeStreak(): Promise<number> {
  const today = startOfDay(new Date());

  const recent = await db.reel.findMany({
    where: {
      status: "posted",
      postedAt: { not: null },
    },
    orderBy: { postedAt: "desc" },
    take: 400,
    select: { postedAt: true },
  });

  if (recent.length === 0) return 0;

  // Group posted dates by day (dedupe multi-posts/day).
  const days = new Set<number>();
  for (const r of recent) {
    if (!r.postedAt) continue;
    days.add(startOfDay(r.postedAt).getTime());
  }

  let streak = 0;
  let cursor = today;
  const todayMs = today.getTime();
  const yesterdayMs = addDays(today, -1).getTime();

  // Allow streak to start at today OR yesterday (haven't posted today yet).
  if (!days.has(todayMs)) {
    if (days.has(yesterdayMs)) {
      cursor = addDays(today, -1);
    } else {
      return 0;
    }
  }

  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export async function computeCurrentDayNumber(): Promise<number> {
  const lastPosted = await db.reel.findFirst({
    where: { status: "posted" },
    orderBy: { dayNumber: "desc" },
    select: { dayNumber: true },
  });
  if (!lastPosted) return 1;
  return lastPosted.dayNumber + 1;
}

export async function nextDayNumber(): Promise<number> {
  const last = await db.reel.findFirst({
    orderBy: { dayNumber: "desc" },
    select: { dayNumber: true },
  });
  return last ? last.dayNumber + 1 : 1;
}
