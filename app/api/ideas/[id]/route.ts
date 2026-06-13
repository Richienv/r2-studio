import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, notFound, handleError, getActor, logActivity } from "@/lib/api";
import { serializeIdea } from "@/lib/serializers";
import { serializeStringArray } from "@/lib/json-array";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  content: z.string().optional(),
  pillarId: z.string().nullish(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullish(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const idea = await db.idea.findUnique({
    where: { id: params.id },
    include: { pillar: true, reel: true },
  });
  if (!idea) return notFound("idea");
  return ok({ idea: serializeIdea(idea) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patch = patchSchema.parse(await req.json());
    const existing = await db.idea.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("idea");

    const data: Record<string, unknown> = {};
    if (patch.content !== undefined) data.content = patch.content;
    if (patch.pillarId !== undefined) data.pillarId = patch.pillarId;
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.tags !== undefined) data.tags = serializeStringArray(patch.tags);
    if (patch.notes !== undefined) data.notes = patch.notes;

    const idea = await db.idea.update({
      where: { id: params.id },
      data,
      include: { pillar: true },
    });

    await logActivity({
      actor: getActor(req),
      action: "idea.updated",
      entityId: idea.id,
      entityType: "idea",
      payload: { changed: Object.keys(data) },
    });

    return ok({ idea: serializeIdea(idea) });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.idea.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("idea");
    await db.idea.delete({ where: { id: params.id } });
    await logActivity({
      actor: getActor(req),
      action: "idea.deleted",
      entityId: params.id,
      entityType: "idea",
    });
    return ok({ deleted: true, id: params.id });
  } catch (e) {
    return handleError(e);
  }
}
