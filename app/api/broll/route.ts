import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, handleError, getActor, logActivity } from "@/lib/api";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  tag: z.string().min(1),
  filePath: z.string().min(1),
  duration: z.number().positive(),
  category: z.string().min(1),
  description: z.string().nullish(),
});

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const where: Record<string, unknown> = {};
    const category = sp.get("category");
    const tag = sp.get("tag");
    if (category) where.category = category;
    if (tag) where.tag = tag;
    const clips = await db.brollClip.findMany({
      where,
      orderBy: [{ category: "asc" }, { tag: "asc" }],
    });
    return ok({ clips });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = createSchema.parse(await req.json());
    const clip = await db.brollClip.create({ data });
    await logActivity({
      actor: getActor(req),
      action: "broll.created",
      entityId: clip.id,
      entityType: "broll",
      payload: { tag: clip.tag, category: clip.category },
    });
    return ok({ clip }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
