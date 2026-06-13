// POST /api/hermes/promote-idea (auth) — uniform /api/hermes/* wrapper around the
// idea→reel promotion. Mirrors the logic in /api/ideas/[id]/promote (which is left
// untouched), adding an optional hookOverride.

import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  dataOk,
  dataErr,
  handleHermesError,
  getActor,
  logActivity,
  corsPreflight,
} from "@/lib/api";
import { serializeReel } from "@/lib/serializers";
import { serializeStringArray } from "@/lib/json-array";
import { nextDayNumber } from "@/lib/streak";
import { startOfDay, addDays } from "@/lib/dates";

export const dynamic = "force-dynamic";

const schema = z.object({
  ideaId: z.string().min(1),
  scheduledFor: z.string().optional(),
  hookOverride: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    const actor = getActor(req);

    const idea = await db.idea.findUnique({ where: { id: data.ideaId } });
    if (!idea) return dataErr("idea-not-found", `Unknown idea '${data.ideaId}'`, 404);
    if (idea.promotedToReelId)
      return dataErr("already-promoted", "Idea already promoted to a reel", 409);
    if (!idea.pillarId)
      return dataErr("pillar-required", "Idea has no pillar — set one first", 400);

    const dayNumber = await nextDayNumber();
    const scheduledDate = data.scheduledFor
      ? new Date(data.scheduledFor)
      : startOfDay(addDays(new Date(), 1));

    const reel = await db.reel.create({
      data: {
        pillarId: idea.pillarId,
        scheduledDate,
        dayNumber,
        hook: (data.hookOverride ?? idea.content).slice(0, 200),
        notes: idea.notes,
        brollList: serializeStringArray([]),
        status: "idea",
      },
      include: { pillar: true },
    });

    await db.idea.update({
      where: { id: idea.id },
      data: { promotedToReelId: reel.id, status: "promoted" },
    });

    await logActivity({
      actor,
      action: "idea.promoted",
      entityId: idea.id,
      entityType: "idea",
      payload: { reelId: reel.id, dayNumber, via: "hermes" },
    });

    return dataOk({ reel: serializeReel(reel) }, 201);
  } catch (e) {
    return handleHermesError(e);
  }
}

export function OPTIONS() {
  return corsPreflight();
}
