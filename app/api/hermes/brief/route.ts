import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, handleError, CORS_HEADERS, corsPreflight } from "@/lib/api";
import { startOfDay, endOfDay, addDays } from "@/lib/dates";
import { computeStreak, computeCurrentDayNumber } from "@/lib/streak";

export const dynamic = "force-dynamic";

const schema = z.object({
  // new vocabulary + legacy "filming-day" alias (kept working)
  type: z.enum(["today", "week", "capture-prompt", "film-prompt", "filming-day"]),
});

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// reel.status → what's still pending, in Ren's voice.
const REEL_PHRASE: Record<string, string> = {
  idea: "masih ide, butuh script",
  scripted: "udah scripted, butuh filming + edit",
  filmed: "udah difilm, butuh edit",
  edited: "udah diedit, siap post",
  posted: "udah posted",
};

function reply(type: string, text: string, data: Record<string, unknown>) {
  // { ok, data:{type,text} } is the new contract; brief/data kept for back-compat.
  return ok(
    { ok: true, type, text, brief: text, data: { type, text, ...data } },
    { headers: CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { type } = schema.parse(await req.json());
    const now = new Date();
    const day = await computeCurrentDayNumber();
    const streak = await computeStreak();
    const todayDow = now.getDay() === 0 ? 7 : now.getDay();

    if (type === "today") {
      const pillar = await db.pillar.findFirst({ where: { dayOfWeek: todayDow } });
      const reel = await db.reel.findFirst({
        where: { scheduledDate: { gte: startOfDay(now), lte: endOfDay(now) } },
        include: { pillar: true },
        orderBy: { dayNumber: "asc" },
      });
      const ideaCount = await db.idea.count({
        where: { status: { notIn: ["promoted", "archived"] } },
      });
      const opinionFresh = await db.opinion.count({ where: { status: "fresh" } });

      const reelPhrase = reel
        ? `Reel ${REEL_PHRASE[reel.status] ?? reel.status}`
        : "Belum ada reel dijadwalin hari ini";
      const opinionBit = opinionFresh
        ? `, ${opinionFresh} opini siap promote`
        : "";
      const text = `Day ${day} ${HARI[now.getDay()]} ${pillar?.name ?? "-"}. ${reelPhrase}. Bank ide ${ideaCount} fresh${opinionBit}.`;

      return reply(type, text, {
        day,
        weekDay: HARI[now.getDay()],
        pillar: pillar?.name ?? null,
        reel: reel ? { id: reel.id, hook: reel.hook, status: reel.status } : null,
        ideaCount,
        opinionFresh,
      });
    }

    if (type === "week") {
      const end = endOfDay(addDays(now, 6));
      const reels = await db.reel.findMany({
        where: { scheduledDate: { gte: startOfDay(now), lte: end } },
        include: { pillar: true },
      });
      const scheduled = reels.filter((r) => r.status !== "posted").length;
      const posted = reels.filter((r) => r.status === "posted").length;

      const byPillar = new Map<string, number>();
      for (const r of reels)
        byPillar.set(r.pillar.name, (byPillar.get(r.pillar.name) ?? 0) + 1);
      const dominant =
        Array.from(byPillar.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        null;

      const text = `Minggu ini ${scheduled}/7 reel scheduled · ${posted} posted · streak content ${streak} hari.${dominant ? ` Pillar ${dominant} dominan.` : ""}`;

      return reply(type, text, {
        scheduled,
        posted,
        streak,
        dominant,
        captureRate: `${reels.length}/7`,
      });
    }

    if (type === "capture-prompt") {
      const todayIdeas = await db.idea.count({
        where: { createdAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      });
      const text =
        todayIdeas === 0
          ? "Hari ini belum capture ide. Mau ngomong apa yang lagi kepikiran?"
          : `Udah ${todayIdeas} ide ke-capture hari ini. Masih ada lagi yang kepikiran?`;
      return reply(type, text, { todayIdeas });
    }

    // film-prompt (and legacy "filming-day"): find a reel waiting to be filmed.
    const queue = await db.reel.findFirst({
      where: { status: { in: ["idea", "scripted"] } },
      include: { pillar: true },
      orderBy: { scheduledDate: "asc" },
    });
    const text = queue
      ? `Reel '${queue.hook ?? queue.pillar.name}' butuh filming. Setup mic + ring light, 5 menit doang.`
      : "Gak ada reel yang nunggu difilm. Mau scripting yang baru?";
    return reply("film-prompt", text, {
      reel: queue
        ? { id: queue.id, hook: queue.hook, pillar: queue.pillar.name, status: queue.status }
        : null,
    });
  } catch (e) {
    return handleError(e);
  }
}

export function OPTIONS() {
  return corsPreflight();
}
