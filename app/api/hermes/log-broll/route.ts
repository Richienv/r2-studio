// POST /api/hermes/log-broll (auth) — add a clip to the b-roll library.
// BrollClip needs a unique `tag` + `filePath` + `duration` + `category`; Ren only
// gives url/note/tags/pillarHint, so we synthesize the rest and guarantee a unique
// tag (collisions would otherwise 500 on the unique constraint).

import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import {
  dataOk,
  handleHermesError,
  getActor,
  logActivity,
  corsPreflight,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    url: z.string().optional(),
    note: z.string().optional(),
    tags: z.array(z.string()).default([]),
    pillarHint: z.string().optional(),
    duration: z.number().positive().optional(),
  })
  .refine((d) => Boolean(d.url || d.note), {
    message: "Provide at least one of `url` or `note`.",
  });

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "clip"
  );
}

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    const actor = getActor(req);

    const base = data.tags[0] ?? data.note ?? data.url ?? "clip";
    const tag = `${slug(base)}-${randomUUID().slice(0, 8)}`;
    const category =
      data.pillarHint?.toUpperCase() ?? data.tags[0]?.toUpperCase() ?? "UNSORTED";
    const descParts = [
      data.note,
      data.tags.length ? data.tags.map((t) => `#${t}`).join(" ") : null,
    ].filter(Boolean);

    const clip = await db.brollClip.create({
      data: {
        tag,
        filePath: data.url ?? data.note ?? "",
        duration: data.duration ?? 0,
        category,
        description: descParts.join(" · ") || null,
      },
    });

    await logActivity({
      actor,
      action: "broll.logged",
      entityId: clip.id,
      entityType: "broll",
      payload: { tag, category, via: "hermes" },
    });

    return dataOk({ clip }, 201);
  } catch (e) {
    return handleHermesError(e);
  }
}

export function OPTIONS() {
  return corsPreflight();
}
