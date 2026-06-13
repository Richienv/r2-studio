// POST /api/hermes/log-reel (auth) — log a full reel in one go.
// Ren speaks DRAFT/SCHEDULED/POSTED; we map to the real pipeline status.

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
import { startOfDay } from "@/lib/dates";
import { mapRenStatus, resolvePillar } from "@/lib/hermes";

export const dynamic = "force-dynamic";

const schema = z.object({
  hook: z.string().min(1),
  pillar: z.string().min(1), // id or name
  dayNumber: z.number().int().positive().optional(),
  status: z.string().optional(), // DRAFT|SCHEDULED|FILMED|EDITED|POSTED|...
  scheduledFor: z.string().optional(),
  brollIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    const actor = getActor(req);

    const pillar = await resolvePillar(data.pillar);
    if (!pillar)
      return dataErr("pillar-not-found", `Unknown pillar '${data.pillar}'`, 404);

    const status = mapRenStatus(data.status ?? "DRAFT");
    const dayNumber = data.dayNumber ?? (await nextDayNumber());
    const scheduledDate = data.scheduledFor
      ? new Date(data.scheduledFor)
      : startOfDay(new Date());

    const now = new Date();
    const reel = await db.reel.create({
      data: {
        pillarId: pillar.id,
        scheduledDate,
        dayNumber,
        hook: data.hook,
        status,
        brollList: serializeStringArray(data.brollIds ?? []),
        notes: data.notes ?? null,
        filmedAt: status === "filmed" ? now : undefined,
        editedAt: status === "edited" ? now : undefined,
        postedAt: status === "posted" ? now : undefined,
      },
      include: { pillar: true },
    });

    await logActivity({
      actor,
      action: "reel.logged",
      entityId: reel.id,
      entityType: "reel",
      payload: { dayNumber, pillar: pillar.name, status, via: "hermes" },
    });

    return dataOk({ reel: serializeReel(reel) }, 201);
  } catch (e) {
    return handleHermesError(e);
  }
}

export function OPTIONS() {
  return corsPreflight();
}
