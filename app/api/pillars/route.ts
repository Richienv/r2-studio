import { db } from "@/lib/db";
import { ok, handleError, CORS_HEADERS, corsPreflight } from "@/lib/api";
import { PILLAR_KEYWORDS } from "@/lib/classifier";

export const dynamic = "force-dynamic";

// Keep the existing `{ pillars }` shape (the UI depends on it) but enrich each
// pillar with the classifier keywords so Ren can map natural language → pillar id
// instead of guessing — same idea as R2·FIT's /api/ingredients.
export async function GET() {
  try {
    const pillars = await db.pillar.findMany({
      orderBy: { dayOfWeek: "asc" },
    });
    const keywordsByName = new Map(
      PILLAR_KEYWORDS.map((p) => [p.pillar, p.words])
    );
    const enriched = pillars.map((p) => ({
      ...p,
      keywords: keywordsByName.get(p.name) ?? [],
    }));
    return ok({ pillars: enriched }, { headers: CORS_HEADERS });
  } catch (e) {
    return handleError(e);
  }
}

export function OPTIONS() {
  return corsPreflight();
}
