import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, notFound, handleError, getActor, logActivity } from "@/lib/api";
import { serializeReel } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const STATUSES = ["idea", "scripted", "filmed", "edited", "posted"] as const;

const schema = z.object({
  newStatus: z.enum(STATUSES),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { newStatus } = schema.parse(await req.json());

    const existing = await db.reel.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("reel");

    const data: Record<string, unknown> = { status: newStatus };
    const now = new Date();
    if (newStatus === "filmed" && !existing.filmedAt) data.filmedAt = now;
    if (newStatus === "edited" && !existing.editedAt) data.editedAt = now;
    if (newStatus === "posted" && !existing.postedAt) data.postedAt = now;

    const reel = await db.reel.update({
      where: { id: params.id },
      data,
      include: { pillar: true },
    });

    await logActivity({
      actor: getActor(req),
      action: `reel.status.${newStatus}`,
      entityId: reel.id,
      entityType: "reel",
      payload: { from: existing.status, to: newStatus },
    });

    return ok({ reel: serializeReel(reel) });
  } catch (e) {
    return handleError(e);
  }
}
