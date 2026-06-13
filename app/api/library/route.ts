// GET /api/library (public) — Hermes-friendly view over the b-roll library.
// Optional ?tag= and ?category=. Mirrors /api/broll's data but in the uniform
// { ok:true, data:{ items } } envelope with CORS, so Ren can pick a real clip id
// instead of inventing one.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { dataOk, handleHermesError, corsPreflight } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const tag = sp.get("tag");
    const category = sp.get("category");

    const where: Record<string, unknown> = {};
    if (tag) where.tag = tag;
    if (category) where.category = category.toUpperCase();

    const items = await db.brollClip.findMany({
      where,
      orderBy: [{ category: "asc" }, { tag: "asc" }],
    });

    return dataOk({ count: items.length, items });
  } catch (e) {
    return handleHermesError(e);
  }
}

export function OPTIONS() {
  return corsPreflight();
}
