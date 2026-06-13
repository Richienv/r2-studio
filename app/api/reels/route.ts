import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, bad, handleError, getActor, logActivity } from "@/lib/api";
import { serializeReel } from "@/lib/serializers";
import { serializeStringArray, serializeJsonField } from "@/lib/json-array";
import { nextDayNumber } from "@/lib/streak";

export const dynamic = "force-dynamic";

const STATUSES = ["idea", "scripted", "filmed", "edited", "posted"] as const;

const createSchema = z.object({
  pillarId: z.string().min(1),
  scheduledDate: z.string().min(1),
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
});

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status");
    const pillar = sp.get("pillar");
    const from = sp.get("from");
    const to = sp.get("to");
    const limit = Math.min(Number(sp.get("limit") ?? 100), 365);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (from || to) {
      const range: { gte?: Date; lte?: Date } = {};
      if (from) range.gte = new Date(from);
      if (to) range.lte = new Date(to);
      where.scheduledDate = range;
    }
    if (pillar) {
      const p = await db.pillar.findFirst({
        where: {
          OR: [
            { id: pillar },
            { name: pillar.toUpperCase() },
          ],
        },
      });
      if (p) where.pillarId = p.id;
      else return ok({ reels: [] });
    }

    const reels = await db.reel.findMany({
      where,
      include: { pillar: true },
      orderBy: { scheduledDate: "asc" },
      take: limit,
    });
    return ok({ reels: reels.map(serializeReel) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const pillar = await db.pillar.findUnique({ where: { id: data.pillarId } });
    if (!pillar) return bad("pillar not found", 404);

    const dayNumber = data.dayNumber ?? (await nextDayNumber());

    const reel = await db.reel.create({
      data: {
        pillarId: data.pillarId,
        scheduledDate: new Date(data.scheduledDate),
        dayNumber,
        hook: data.hook ?? null,
        act1Broll: data.act1Broll ?? null,
        act2Script: data.act2Script ?? null,
        act3Payoff: data.act3Payoff ?? null,
        cta: data.cta ?? undefined,
        musicVibe: data.musicVibe ?? null,
        textOverlays: serializeJsonField(data.textOverlays),
        brollList: serializeStringArray(data.brollList ?? []),
        status: data.status ?? "idea",
        notes: data.notes ?? null,
        estimatedDurationSec: data.estimatedDurationSec ?? 45,
      },
      include: { pillar: true },
    });

    await logActivity({
      actor: getActor(req),
      action: "reel.created",
      entityId: reel.id,
      entityType: "reel",
      payload: { dayNumber, pillarId: data.pillarId, status: reel.status },
    });

    return ok({ reel: serializeReel(reel) }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
