import { db } from "@/lib/db";
import { ok, handleError } from "@/lib/api";
import { computeStreak, computeCurrentDayNumber } from "@/lib/streak";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const day = await computeCurrentDayNumber();
    const streak = await computeStreak();
    const totalIdeas = await db.idea.count({ where: { status: { not: "promoted" } } });
    const totalOpinions = await db.opinion.count({ where: { status: "fresh" } });
    const pending = await db.reel.count({
      where: { status: { in: ["idea", "scripted", "filmed"] } },
    });

    const msg = [
      `Yo Ren — day ${day} of 365.`,
      `🔥 Streak: ${streak} hari berturut-turut.`,
      `📝 ${totalIdeas} ide nunggu, ${totalOpinions} opini fresh di laci.`,
      `🎬 ${pending} reel di pipeline belum kelar.`,
    ].join(" ");

    return ok({
      status: msg,
      stats: { day, streak, totalIdeas, totalOpinions, pending },
    });
  } catch (e) {
    return handleError(e);
  }
}
