export type Pillar = {
  id: string;
  name: string;
  dayOfWeek: number;
  colorMode: string;
  description: string;
};

export type ReelStatus = "idea" | "scripted" | "filmed" | "edited" | "posted";

export type Reel = {
  id: string;
  dayNumber: number;
  scheduledDate: string;
  pillarId: string;
  pillar?: Pillar | null;
  hook: string | null;
  act1Broll: string | null;
  act2Script: string | null;
  act3Payoff: string | null;
  cta: string | null;
  musicVibe: string | null;
  textOverlays: unknown;
  brollList: string[];
  status: ReelStatus;
  filmedAt: string | null;
  editedAt: string | null;
  postedAt: string | null;
  igUrl: string | null;
  tiktokUrl: string | null;
  notes: string | null;
  estimatedDurationSec: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Idea = {
  id: string;
  content: string;
  pillarId: string | null;
  pillar?: Pillar | null;
  status: string;
  source: string;
  tags: string[];
  notes: string | null;
  promotedToReelId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Opinion = {
  id: string;
  content: string;
  context: string | null;
  tags: string[];
  status: string;
  usedInReelId: string | null;
  createdAt: string;
};

export type BrollClip = {
  id: string;
  tag: string;
  filePath: string;
  duration: number;
  category: string;
  description: string | null;
  usedCount: number;
  lastUsedAt: string | null;
  createdAt: string;
};

export type Summary = {
  metric: string;
  unit: string;
  label: string;
  highlight: string | null;
  trend: "up" | "down" | "flat";
  lastUpdated: string;
};

export type TodayPayload = {
  day: number;
  streak: number;
  date: string;
  filming: Reel[];
  posting: Reel[];
};

export type WeekPayload = {
  start: string;
  days: Array<{ date: string; reels: Reel[] }>;
};
