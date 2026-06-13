import { parseStringArray, parseJsonField } from "./json-array";

type ReelRow = {
  id: string;
  dayNumber: number;
  scheduledDate: Date;
  pillarId: string;
  hook: string | null;
  act1Broll: string | null;
  act2Script: string | null;
  act3Payoff: string | null;
  cta: string | null;
  musicVibe: string | null;
  textOverlays: unknown; // Postgres Json
  brollList: string[];
  status: string;
  filmedAt: Date | null;
  editedAt: Date | null;
  postedAt: Date | null;
  igUrl: string | null;
  tiktokUrl: string | null;
  notes: string | null;
  estimatedDurationSec: number | null;
  createdAt: Date;
  updatedAt: Date;
  pillar?: { id: string; name: string; dayOfWeek: number } | null;
};

export function serializeReel(r: ReelRow) {
  return {
    ...r,
    brollList: parseStringArray(r.brollList),
    textOverlays: parseJsonField(r.textOverlays),
  };
}

type IdeaRow = {
  id: string;
  content: string;
  pillarId: string | null;
  status: string;
  source: string;
  tags: string[];
  notes: string | null;
  promotedToReelId: string | null;
  createdAt: Date;
  updatedAt: Date;
  pillar?: { id: string; name: string } | null;
};

export function serializeIdea(i: IdeaRow) {
  return {
    ...i,
    tags: parseStringArray(i.tags),
  };
}

type OpinionRow = {
  id: string;
  content: string;
  context: string | null;
  tags: string[];
  status: string;
  usedInReelId: string | null;
  createdAt: Date;
};

export function serializeOpinion(o: OpinionRow) {
  return {
    ...o,
    tags: parseStringArray(o.tags),
  };
}
