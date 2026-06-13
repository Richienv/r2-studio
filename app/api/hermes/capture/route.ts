import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, handleError, logActivity, CORS_HEADERS, corsPreflight } from "@/lib/api";
import { classifyText } from "@/lib/classifier";
import { resolvePillar } from "@/lib/hermes";
import { serializeIdea, serializeOpinion } from "@/lib/serializers";
import { serializeStringArray } from "@/lib/json-array";

export const dynamic = "force-dynamic";

const schema = z.object({
  text: z.string().min(1),
  // ── legacy fields (kept working, do not remove) ──
  source: z.enum(["telegram", "voice", "claude", "manual"]).optional(),
  forceKind: z.enum(["idea", "opinion"]).optional(),
  pillarHint: z.string().optional(),
  // ── structured fields: Ren pre-classifies confidently ──
  type: z.enum(["IDEA", "OPINION", "idea", "opinion"]).optional(),
  pillar: z.string().optional(), // exact pillar id OR name
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    const actor = req.headers.get("x-actor") || "hermes-ren";

    const classified = classifyText(data.text);
    const structuredKind = data.type?.toLowerCase() as "idea" | "opinion" | undefined;
    const kind = structuredKind ?? data.forceKind ?? classified.kind;
    const classifiedBy: "ren" | "heuristic" =
      data.type || data.forceKind ? "ren" : "heuristic";

    // Pillar: explicit id/name wins, then legacy pillarHint, then classifier.
    let pillar = await resolvePillar(data.pillar ?? data.pillarHint ?? null);
    if (!pillar && classified.pillarName) {
      pillar = await db.pillar.findFirst({ where: { name: classified.pillarName } });
    }
    const pillarId = pillar?.id ?? null;
    const pillarName = pillar?.name ?? null;
    const tags = data.tags ?? [];

    if (kind === "opinion") {
      const opinion = await db.opinion.create({
        data: {
          content: data.text,
          context: data.title ?? null,
          tags: serializeStringArray(tags),
          status: "fresh",
        },
      });
      await logActivity({
        actor,
        action: "opinion.captured",
        entityId: opinion.id,
        entityType: "opinion",
        payload: { source: data.source ?? "manual", classifiedBy, classified },
      });
      const entity = serializeOpinion(opinion);
      return ok(
        {
          ok: true,
          saved: true,
          entity, // legacy
          classification: `opinion-${pillarName?.toLowerCase() ?? "uncategorized"}`, // legacy
          classifiedBy,
          data: {
            entry: { ...entity, type: "OPINION", pillar: pillarName },
            classifiedBy,
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    const idea = await db.idea.create({
      data: {
        content: data.text,
        pillarId,
        status: "draft",
        source: data.source ?? "hermes",
        tags: serializeStringArray(tags),
        notes: data.title ?? null,
      },
      include: { pillar: true },
    });
    await logActivity({
      actor,
      action: "idea.captured",
      entityId: idea.id,
      entityType: "idea",
      payload: { source: data.source ?? "hermes", classifiedBy, classified },
    });
    const entity = serializeIdea(idea);
    return ok(
      {
        ok: true,
        saved: true,
        entity, // legacy
        classification: `idea-${pillarName?.toLowerCase() ?? "uncategorized"}`, // legacy
        classifiedBy,
        data: {
          entry: { ...entity, type: "IDEA", pillar: pillarName },
          classifiedBy,
        },
      },
      { headers: CORS_HEADERS }
    );
  } catch (e) {
    return handleError(e);
  }
}

export function OPTIONS() {
  return corsPreflight();
}
