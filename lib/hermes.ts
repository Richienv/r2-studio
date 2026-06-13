// Shared helpers for the /api/hermes/* surface.
// Ren speaks a simplified status vocabulary (DRAFT/SCHEDULED/POSTED/ARCHIVED);
// the app's reel pipeline is idea → scripted → filmed → edited → posted.
// Map Ren's words onto the real statuses so he never writes an unknown value.

import { db } from "./db";

const REN_TO_REEL: Record<string, string> = {
  DRAFT: "idea",
  IDEA: "idea",
  SCRIPTED: "scripted",
  SCHEDULED: "scripted",
  FILMED: "filmed",
  EDITED: "edited",
  POSTED: "posted",
  ARCHIVED: "archived",
};

export const REN_REEL_STATUSES = Object.keys(REN_TO_REEL);

export function mapRenStatus(input: string): string {
  const key = input.trim().toUpperCase();
  return REN_TO_REEL[key] ?? input.trim().toLowerCase();
}

// Accept a pillar id OR a pillar name (case-insensitive). Returns the row or null.
export async function resolvePillar(idOrName?: string | null) {
  if (!idOrName) return null;
  const v = idOrName.trim();
  if (!v) return null;
  const byId = await db.pillar.findUnique({ where: { id: v } }).catch(() => null);
  if (byId) return byId;
  return db.pillar.findFirst({ where: { name: v.toUpperCase() } });
}
