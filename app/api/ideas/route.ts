import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, handleError, getActor, logActivity } from "@/lib/api";
import { serializeIdea } from "@/lib/serializers";
import { serializeStringArray } from "@/lib/json-array";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  content: z.string().min(1),
  pillarId: z.string().nullish(),
  status: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullish(),
});

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const pillar = sp.get("pillar");
    const status = sp.get("status");
    const tagsParam = sp.get("tags");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (pillar) {
      const p = await db.pillar.findFirst({
        where: { OR: [{ id: pillar }, { name: pillar.toUpperCase() }] },
      });
      if (p) where.pillarId = p.id;
      else return ok({ ideas: [] });
    }

    let ideas = await db.idea.findMany({
      where,
      include: { pillar: true },
      orderBy: { createdAt: "desc" },
    });

    if (tagsParam) {
      const needed = tagsParam.split(",").map((t) => t.trim().toLowerCase());
      ideas = ideas.filter((i) => {
        const arr = i.tags; // Postgres returns a native string[]
        return needed.every((t) => arr.map((x) => x.toLowerCase()).includes(t));
      });
    }

    return ok({ ideas: ideas.map(serializeIdea) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = createSchema.parse(await req.json());
    const idea = await db.idea.create({
      data: {
        content: data.content,
        pillarId: data.pillarId ?? null,
        status: data.status ?? "draft",
        source: data.source ?? "manual",
        tags: serializeStringArray(data.tags ?? []),
        notes: data.notes ?? null,
      },
      include: { pillar: true },
    });
    await logActivity({
      actor: getActor(req),
      action: "idea.created",
      entityId: idea.id,
      entityType: "idea",
      payload: { source: idea.source, pillarId: idea.pillarId },
    });
    return ok({ idea: serializeIdea(idea) }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
