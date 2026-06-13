// POST /api/hermes/update-status (auth) — drive the reel status cycle from a
// Telegram message. Reuses the same timestamp-stamping logic as
// /api/reels/[id]/status, mapping Ren's vocabulary onto the real statuses.

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
import { mapRenStatus } from "@/lib/hermes";

export const dynamic = "force-dynamic";

const schema = z.object({
  reelId: z.string().min(1),
  status: z.string().min(1), // DRAFT|SCHEDULED|FILMED|EDITED|POSTED|ARCHIVED
  postedUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    const actor = getActor(req);

    const existing = await db.reel.findUnique({ where: { id: data.reelId } });
    if (!existing)
      return dataErr("reel-not-found", `Unknown reel '${data.reelId}'`, 404);

    const status = mapRenStatus(data.status);
    const patch: Record<string, unknown> = { status };
    const now = new Date();
    if (status === "filmed" && !existing.filmedAt) patch.filmedAt = now;
    if (status === "edited" && !existing.editedAt) patch.editedAt = now;
    if (status === "posted" && !existing.postedAt) patch.postedAt = now;
    if (status === "posted" && data.postedUrl) patch.igUrl = data.postedUrl;

    const reel = await db.reel.update({
      where: { id: data.reelId },
      data: patch,
      include: { pillar: true },
    });

    await logActivity({
      actor,
      action: `reel.status.${status}`,
      entityId: reel.id,
      entityType: "reel",
      payload: { from: existing.status, to: status, via: "hermes" },
    });

    return dataOk({ reel: serializeReel(reel) });
  } catch (e) {
    return handleHermesError(e);
  }
}

export function OPTIONS() {
  return corsPreflight();
}
