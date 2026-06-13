// GET /api/categories (public) — vocabulary that is NOT a pillar, so Ren can map
// cleanly: entry types (idea vs opinion), the reel pipeline statuses (with the
// DRAFT/SCHEDULED/POSTED words Ren uses → real status), and the b-roll categories
// actually present in the library.

import { db } from "@/lib/db";
import { dataOk, handleHermesError, corsPreflight } from "@/lib/api";

export const dynamic = "force-dynamic";

const ENTRY_TYPES = [
  {
    kind: "entry-type",
    key: "IDEA",
    description: "Content idea / angle → stored in the Idea bank.",
  },
  {
    kind: "entry-type",
    key: "OPINION",
    description: "Contrarian take / manifesto line → stored in the Opinion bank.",
  },
];

// Ren's word → the real reel.status it maps to.
const REEL_STATUSES = [
  { kind: "reel-status", key: "DRAFT", maps: "idea", description: "Captured, not scripted yet." },
  { kind: "reel-status", key: "SCRIPTED", maps: "scripted", description: "Script written." },
  { kind: "reel-status", key: "SCHEDULED", maps: "scripted", description: "Planned with a date." },
  { kind: "reel-status", key: "FILMED", maps: "filmed", description: "Footage shot." },
  { kind: "reel-status", key: "EDITED", maps: "edited", description: "Edit done, ready to post." },
  { kind: "reel-status", key: "POSTED", maps: "posted", description: "Published to IG/TikTok." },
  { kind: "reel-status", key: "ARCHIVED", maps: "archived", description: "Shelved." },
];

export async function GET() {
  try {
    const rows = await db.brollClip.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    const brollCategories = rows.map((r) => ({
      kind: "broll-category" as const,
      key: r.category,
    }));

    return dataOk({
      categories: [...ENTRY_TYPES, ...REEL_STATUSES, ...brollCategories],
    });
  } catch (e) {
    return handleHermesError(e);
  }
}

export function OPTIONS() {
  return corsPreflight();
}
