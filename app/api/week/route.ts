import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, addDays } from "@/lib/dates";
import { serializeReel } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startParam = req.nextUrl.searchParams.get("startDate");
  const start = startParam ? startOfDay(new Date(startParam)) : startOfDay(new Date());
  const end = endOfDay(addDays(start, 6));

  const reels = await db.reel.findMany({
    where: {
      scheduledDate: { gte: start, lte: end },
    },
    include: { pillar: true },
    orderBy: { scheduledDate: "asc" },
  });

  // Bucket by day-of-week index 0..6
  const buckets: Array<{ date: string; reels: ReturnType<typeof serializeReel>[] }> = [];
  for (let i = 0; i < 7; i++) {
    const d = startOfDay(addDays(start, i));
    const dEnd = endOfDay(d);
    const dayReels = reels.filter(
      (r) => r.scheduledDate >= d && r.scheduledDate <= dEnd
    );
    buckets.push({ date: d.toISOString(), reels: dayReels.map(serializeReel) });
  }

  return NextResponse.json({ start: start.toISOString(), days: buckets });
}
