import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, notFound, handleError, getActor, logActivity } from "@/lib/api";
import { serializeReel } from "@/lib/serializers";
import { serializeStringArray, serializeJsonField } from "@/lib/json-array";

export const dynamic = "force-dynamic";

const STATUSES = ["idea", "scripted", "filmed", "edited", "posted"] as const;

const patchSchema = z.object({
  pillarId: z.string().optional(),
  scheduledDate: z.string().optional(),
  dayNumber: z.number().int().positive().optional(),
  hook: z.string().nullish(),
  act1Broll: z.string().nullish(),
  act2Script: z.string().nullish(),
  act3Payoff: z.string().nullish(),
  cta: z.string().nullish(),
  musicVibe: z.string().nullish(),
  textOverlays: z.unknown().optional(),
  brollList: z.array(z.string()).optional(),
  status: z.enum(STATUSES).optional(),
  notes: z.string().nullish(),
  estimatedDurationSec: z.number().int().nullish(),
  igUrl: z.string().nullish(),
  tiktokUrl: z.string().nullish(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reel = await db.reel.findUnique({
      where: { id: params.id },
      include: { pillar: true, idea: true },
    });
    if (!reel) return notFound("reel");
    return ok({ reel: serializeReel(reel) });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const patch = patchSchema.parse(body);

    const existing = await db.reel.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("reel");

    const data: Record<string, unknown> = {};
    if (patch.pillarId !== undefined) data.pillarId = patch.pillarId;
    if (patch.scheduledDate !== undefined)
      data.scheduledDate = new Date(patch.scheduledDate);
    if (patch.dayNumber !== undefined) data.dayNumber = patch.dayNumber;
    if (patch.hook !== undefined) data.hook = patch.hook;
    if (patch.act1Broll !== undefined) data.act1Broll = patch.act1Broll;
    if (patch.act2Script !== undefined) data.act2Script = patch.act2Script;
    if (patch.act3Payoff !== undefined) data.act3Payoff = patch.act3Payoff;
    if (patch.cta !== undefined) data.cta = patch.cta;
    if (patch.musicVibe !== undefined) data.musicVibe = patch.musicVibe;
    if (patch.textOverlays !== undefined)
      data.textOverlays = serializeJsonField(patch.textOverlays);
    if (patch.brollList !== undefined)
      data.brollList = serializeStringArray(patch.brollList);
    if (patch.notes !== undefined) data.notes = patch.notes;
    if (patch.estimatedDurationSec !== undefined)
      data.estimatedDurationSec = patch.estimatedDurationSec;
    if (patch.igUrl !== undefined) data.igUrl = patch.igUrl;
    if (patch.tiktokUrl !== undefined) data.tiktokUrl = patch.tiktokUrl;
    if (patch.status !== undefined) {
      data.status = patch.status;
      const now = new Date();
      if (patch.status === "filmed" && !existing.filmedAt) data.filmedAt = now;
      if (patch.status === "edited" && !existing.editedAt) data.editedAt = now;
      if (patch.status === "posted" && !existing.postedAt) data.postedAt = now;
    }

    const reel = await db.reel.update({
      where: { id: params.id },
      data,
      include: { pillar: true },
    });

    await logActivity({
      actor: getActor(req),
      action: "reel.updated",
      entityId: reel.id,
      entityType: "reel",
      payload: { changed: Object.keys(data) },
    });

    return ok({ reel: serializeReel(reel) });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.reel.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("reel");

    await db.idea.updateMany({
      where: { promotedToReelId: params.id },
      data: { promotedToReelId: null, status: "ready" },
    });

    await db.reel.delete({ where: { id: params.id } });

    await logActivity({
      actor: getActor(req),
      action: "reel.deleted",
      entityId: params.id,
      entityType: "reel",
    });

    return ok({ deleted: true, id: params.id });
  } catch (e) {
    return handleError(e);
  }
}
