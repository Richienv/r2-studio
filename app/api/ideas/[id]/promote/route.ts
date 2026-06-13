import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, bad, notFound, handleError, getActor, logActivity } from "@/lib/api";
import { serializeReel } from "@/lib/serializers";
import { nextDayNumber } from "@/lib/streak";
import { serializeStringArray } from "@/lib/json-array";
import { addDays, startOfDay } from "@/lib/dates";

export const dynamic = "force-dynamic";

const schema = z.object({
  scheduledDate: z.string().optional(),
  dayNumber: z.number().int().positive().optional(),
  pillarId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json().catch(() => ({}))) as unknown;
    const data = schema.parse(body ?? {});

    const idea = await db.idea.findUnique({ where: { id: params.id } });
    if (!idea) return notFound("idea");
    if (idea.promotedToReelId) return bad("idea already promoted", 409);

    const pillarId = data.pillarId ?? idea.pillarId;
    if (!pillarId) return bad("pillarId required (idea has no pillar)", 400);

    const dayNumber = data.dayNumber ?? (await nextDayNumber());
    const scheduledDate = data.scheduledDate
      ? new Date(data.scheduledDate)
      : startOfDay(addDays(new Date(), 1));

    const reel = await db.reel.create({
      data: {
        pillarId,
        scheduledDate,
        dayNumber,
        hook: idea.content.slice(0, 200),
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
      actor: getActor(req),
      action: "idea.promoted",
      entityId: idea.id,
      entityType: "idea",
      payload: { reelId: reel.id, dayNumber },
    });

    return ok({ reel: serializeReel(reel) }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
