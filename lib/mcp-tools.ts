// MCP tool registry. Each tool has a JSON Schema for input + an executor.
// Executors reuse db/lib functions directly (no HTTP round-trip).

import { Prisma } from "@prisma/client";
import { db } from "./db";
import { addDays, endOfDay, startOfDay } from "./dates";
import { classifyText } from "./classifier";
import { computeStreak, computeCurrentDayNumber, nextDayNumber } from "./streak";
import {
  serializeStringArray,
  parseStringArray,
} from "./json-array";

export type JsonSchema = Record<string, unknown>;

export type ToolDef = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  execute: (args: Record<string, unknown>, actor: string) => Promise<unknown>;
};

const STATUSES = ["idea", "scripted", "filmed", "edited", "posted"] as const;

async function logActivity(opts: {
  actor: string;
  action: string;
  entityId?: string | null;
  entityType?: string | null;
  payload?: unknown;
}) {
  try {
    await db.activityLog.create({
      data: {
        actor: opts.actor,
        action: opts.action,
        entityId: opts.entityId ?? null,
        entityType: opts.entityType ?? null,
        payload:
          opts.payload == null
            ? undefined
            : (opts.payload as Prisma.InputJsonValue),
      },
    });
  } catch {}
}

export const TOOLS: ToolDef[] = [
  {
    name: "studio_today_brief",
    description:
      "Get a Ren-friendly briefing for today: day number, streak, and reels scheduled for filming/posting.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: async () => {
      const today = new Date();
      const day = await computeCurrentDayNumber();
      const streak = await computeStreak();
      const reels = await db.reel.findMany({
        where: {
          scheduledDate: { gte: startOfDay(today), lte: endOfDay(today) },
        },
        include: { pillar: true },
      });
      return {
        day,
        streak,
        date: startOfDay(today).toISOString(),
        reels: reels.map((r) => ({
          id: r.id,
          dayNumber: r.dayNumber,
          pillar: r.pillar.name,
          status: r.status,
          hook: r.hook,
        })),
        brief: `Day ${day} of 365 · streak ${streak} · ${reels.length} reel today.`,
      };
    },
  },

  {
    name: "studio_week_view",
    description:
      "Get the next 7 days of scheduled reels, bucketed by date, with pillar + status.",
    inputSchema: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "ISO date (YYYY-MM-DD). Defaults to today.",
        },
      },
      additionalProperties: false,
    },
    execute: async (args) => {
      const startStr = args.startDate as string | undefined;
      const start = startStr ? startOfDay(new Date(startStr)) : startOfDay(new Date());
      const end = endOfDay(addDays(start, 6));
      const reels = await db.reel.findMany({
        where: { scheduledDate: { gte: start, lte: end } },
        include: { pillar: true },
        orderBy: { scheduledDate: "asc" },
      });
      return {
        start: start.toISOString(),
        days: Array.from({ length: 7 }).map((_, i) => {
          const d = startOfDay(addDays(start, i));
          const dEnd = endOfDay(d);
          const dayReels = reels.filter(
            (r) => r.scheduledDate >= d && r.scheduledDate <= dEnd
          );
          return {
            date: d.toISOString(),
            reels: dayReels.map((r) => ({
              id: r.id,
              dayNumber: r.dayNumber,
              pillar: r.pillar.name,
              status: r.status,
              hook: r.hook,
            })),
          };
        }),
      };
    },
  },

  {
    name: "studio_capture_idea",
    description:
      "Capture a content idea. Auto-classifies pillar via keywords. Use when Ren says 'capture idea: ...' or has a content angle to log.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The idea content (raw text)." },
        pillarHint: {
          type: "string",
          description:
            "Optional pillar name (BELAJAR / MINDSET / BUILD / STRUGGLE / HANGZHOU / MANDARIN / VISION).",
        },
      },
      required: ["text"],
      additionalProperties: false,
    },
    execute: async (args, actor) => {
      const text = args.text as string;
      const pillarHint = (args.pillarHint as string | undefined)?.toUpperCase();
      const classified = classifyText(text);
      const pillarName = pillarHint ?? classified.pillarName;
      let pillarId: string | null = null;
      if (pillarName) {
        const p = await db.pillar.findFirst({ where: { name: pillarName } });
        pillarId = p?.id ?? null;
      }
      const idea = await db.idea.create({
        data: {
          content: text,
          pillarId,
          status: "draft",
          source: "hermes",
          tags: serializeStringArray([]),
        },
        include: { pillar: true },
      });
      await logActivity({
        actor,
        action: "idea.captured",
        entityId: idea.id,
        entityType: "idea",
        payload: { source: "mcp", classified },
      });
      return {
        saved: true,
        id: idea.id,
        pillar: idea.pillar?.name ?? null,
        preview: text.slice(0, 120),
      };
    },
  },

  {
    name: "studio_capture_opinion",
    description:
      "Capture a contrarian take or manifesto-style opinion. Use when Ren has a strong opinion worth logging for future MINDSET/VISION reels.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        context: {
          type: "string",
          description: "Optional context — what triggered the opinion.",
        },
      },
      required: ["text"],
      additionalProperties: false,
    },
    execute: async (args, actor) => {
      const text = args.text as string;
      const context = (args.context as string | undefined) ?? null;
      const opinion = await db.opinion.create({
        data: {
          content: text,
          context,
          tags: serializeStringArray([]),
          status: "fresh",
        },
      });
      await logActivity({
        actor,
        action: "opinion.captured",
        entityId: opinion.id,
        entityType: "opinion",
        payload: { source: "mcp" },
      });
      return {
        saved: true,
        id: opinion.id,
        preview: text.slice(0, 120),
      };
    },
  },

  {
    name: "studio_create_reel",
    description:
      "Create a new scheduled reel. Auto-assigns next dayNumber if not provided. Required: pillarName + scheduledDate.",
    inputSchema: {
      type: "object",
      properties: {
        pillarName: {
          type: "string",
          description: "Pillar name (BELAJAR / MINDSET / BUILD / STRUGGLE / HANGZHOU / MANDARIN / VISION).",
        },
        scheduledDate: {
          type: "string",
          description: "ISO date for posting (YYYY-MM-DD).",
        },
        hook: { type: "string" },
        dayNumber: { type: "integer" },
      },
      required: ["pillarName", "scheduledDate"],
      additionalProperties: false,
    },
    execute: async (args, actor) => {
      const pillarName = (args.pillarName as string).toUpperCase();
      const pillar = await db.pillar.findFirst({ where: { name: pillarName } });
      if (!pillar) throw new Error(`pillar '${pillarName}' not found`);
      const dayNumber =
        (args.dayNumber as number | undefined) ?? (await nextDayNumber());
      const reel = await db.reel.create({
        data: {
          pillarId: pillar.id,
          scheduledDate: new Date(args.scheduledDate as string),
          dayNumber,
          hook: (args.hook as string | undefined) ?? null,
          status: "idea",
          brollList: serializeStringArray([]),
        },
        include: { pillar: true },
      });
      await logActivity({
        actor,
        action: "reel.created",
        entityId: reel.id,
        entityType: "reel",
        payload: { dayNumber, pillar: pillar.name },
      });
      return {
        id: reel.id,
        dayNumber: reel.dayNumber,
        pillar: reel.pillar.name,
        scheduledDate: reel.scheduledDate.toISOString(),
      };
    },
  },

  {
    name: "studio_update_reel_status",
    description:
      "Move a reel through the pipeline: idea → scripted → filmed → edited → posted. Auto-stamps filmedAt/editedAt/postedAt.",
    inputSchema: {
      type: "object",
      properties: {
        reelId: { type: "string" },
        newStatus: { type: "string", enum: [...STATUSES] },
      },
      required: ["reelId", "newStatus"],
      additionalProperties: false,
    },
    execute: async (args, actor) => {
      const reelId = args.reelId as string;
      const newStatus = args.newStatus as (typeof STATUSES)[number];
      const existing = await db.reel.findUnique({ where: { id: reelId } });
      if (!existing) throw new Error(`reel '${reelId}' not found`);
      const data: Record<string, unknown> = { status: newStatus };
      const now = new Date();
      if (newStatus === "filmed" && !existing.filmedAt) data.filmedAt = now;
      if (newStatus === "edited" && !existing.editedAt) data.editedAt = now;
      if (newStatus === "posted" && !existing.postedAt) data.postedAt = now;
      const reel = await db.reel.update({
        where: { id: reelId },
        data,
        include: { pillar: true },
      });
      await logActivity({
        actor,
        action: `reel.status.${newStatus}`,
        entityId: reel.id,
        entityType: "reel",
        payload: { from: existing.status, to: newStatus },
      });
      return {
        id: reel.id,
        from: existing.status,
        to: newStatus,
        pillar: reel.pillar.name,
      };
    },
  },

  {
    name: "studio_get_ideas",
    description: "List captured ideas. Filter by pillar or status.",
    inputSchema: {
      type: "object",
      properties: {
        pillar: { type: "string" },
        status: { type: "string" },
        limit: { type: "integer", default: 20 },
      },
      additionalProperties: false,
    },
    execute: async (args) => {
      const limit = (args.limit as number | undefined) ?? 20;
      const where: Record<string, unknown> = {};
      if (args.status) where.status = args.status;
      if (args.pillar) {
        const p = await db.pillar.findFirst({
          where: { name: (args.pillar as string).toUpperCase() },
        });
        if (p) where.pillarId = p.id;
        else return { ideas: [] };
      }
      const ideas = await db.idea.findMany({
        where,
        include: { pillar: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return {
        ideas: ideas.map((i) => ({
          id: i.id,
          content: i.content,
          pillar: i.pillar?.name ?? null,
          status: i.status,
          tags: parseStringArray(i.tags),
          createdAt: i.createdAt.toISOString(),
        })),
      };
    },
  },

  {
    name: "studio_get_opinions",
    description: "List captured opinions. Filter by status (fresh/used/archived).",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string" },
        limit: { type: "integer", default: 20 },
      },
      additionalProperties: false,
    },
    execute: async (args) => {
      const limit = (args.limit as number | undefined) ?? 20;
      const where: Record<string, unknown> = {};
      if (args.status) where.status = args.status;
      const opinions = await db.opinion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return {
        opinions: opinions.map((o) => ({
          id: o.id,
          content: o.content,
          context: o.context,
          status: o.status,
          tags: parseStringArray(o.tags),
          createdAt: o.createdAt.toISOString(),
        })),
      };
    },
  },

  {
    name: "studio_streak",
    description: "Get current posting streak + total posted reels + 365 target.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: async () => {
      const streak = await computeStreak();
      const totalPosted = await db.reel.count({ where: { status: "posted" } });
      const day = await computeCurrentDayNumber();
      return { streak, totalPosted, target: 365, currentDay: day };
    },
  },
];

export function findTool(name: string): ToolDef | undefined {
  return TOOLS.find((t) => t.name === name);
}
