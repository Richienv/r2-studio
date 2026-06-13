import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, notFound, handleError, getActor, logActivity } from "@/lib/api";
import { serializeOpinion } from "@/lib/serializers";
import { serializeStringArray } from "@/lib/json-array";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  content: z.string().optional(),
  context: z.string().nullish(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patch = patchSchema.parse(await req.json());
    const existing = await db.opinion.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("opinion");
    const data: Record<string, unknown> = {};
    if (patch.content !== undefined) data.content = patch.content;
    if (patch.context !== undefined) data.context = patch.context;
    if (patch.tags !== undefined) data.tags = serializeStringArray(patch.tags);
    if (patch.status !== undefined) data.status = patch.status;
    const opinion = await db.opinion.update({
      where: { id: params.id },
      data,
    });
    await logActivity({
      actor: getActor(req),
      action: "opinion.updated",
      entityId: opinion.id,
      entityType: "opinion",
    });
    return ok({ opinion: serializeOpinion(opinion) });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.opinion.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("opinion");
    await db.opinion.delete({ where: { id: params.id } });
    await logActivity({
      actor: getActor(req),
      action: "opinion.deleted",
      entityId: params.id,
      entityType: "opinion",
    });
    return ok({ deleted: true, id: params.id });
  } catch (e) {
    return handleError(e);
  }
}
