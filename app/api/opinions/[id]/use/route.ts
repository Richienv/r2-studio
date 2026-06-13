import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, notFound, handleError, getActor, logActivity } from "@/lib/api";
import { serializeOpinion } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const schema = z.object({
  reelId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json().catch(() => ({}))) as unknown;
    const { reelId } = schema.parse(body ?? {});

    const existing = await db.opinion.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("opinion");

    const opinion = await db.opinion.update({
      where: { id: params.id },
      data: { status: "used", usedInReelId: reelId ?? null },
    });

    await logActivity({
      actor: getActor(req),
      action: "opinion.used",
      entityId: opinion.id,
      entityType: "opinion",
      payload: { reelId },
    });

    return ok({ opinion: serializeOpinion(opinion) });
  } catch (e) {
    return handleError(e);
  }
}
