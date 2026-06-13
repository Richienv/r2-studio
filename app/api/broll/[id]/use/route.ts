import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, handleError, getActor, logActivity } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.brollClip.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("clip");
    const clip = await db.brollClip.update({
      where: { id: params.id },
      data: {
        usedCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
    await logActivity({
      actor: getActor(req),
      action: "broll.used",
      entityId: clip.id,
      entityType: "broll",
    });
    return ok({ clip });
  } catch (e) {
    return handleError(e);
  }
}
