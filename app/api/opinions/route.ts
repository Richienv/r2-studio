import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, handleError, getActor, logActivity } from "@/lib/api";
import { serializeOpinion } from "@/lib/serializers";
import { serializeStringArray } from "@/lib/json-array";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  content: z.string().min(1),
  context: z.string().nullish(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const opinions = await db.opinion.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return ok({ opinions: opinions.map(serializeOpinion) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = createSchema.parse(await req.json());
    const opinion = await db.opinion.create({
      data: {
        content: data.content,
        context: data.context ?? null,
        tags: serializeStringArray(data.tags ?? []),
        status: data.status ?? "fresh",
      },
    });
    await logActivity({
      actor: getActor(req),
      action: "opinion.created",
      entityId: opinion.id,
      entityType: "opinion",
    });
    return ok({ opinion: serializeOpinion(opinion) }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
