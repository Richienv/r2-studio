import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, handleError, getActor, logActivity } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clip = await db.brollClip.findUnique({ where: { id: params.id } });
    if (!clip) return notFound("clip");
    return ok({ clip });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.brollClip.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("clip");
    await db.brollClip.delete({ where: { id: params.id } });
    await logActivity({
      actor: getActor(req),
      action: "broll.deleted",
      entityId: params.id,
      entityType: "broll",
    });
    return ok({ deleted: true, id: params.id });
  } catch (e) {
    return handleError(e);
  }
}
