// GET /api/hermes/health (public) — the single best debugging tool.
// Reports key configuration + DB connectivity + deployed commit, WITHOUT leaking
// the key. `keyMatch` lets you verify a header matches the deployed env var.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CORS_HEADERS, corsPreflight } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = process.env.R2_STUDIO_API_KEY ?? "";
  const expected = raw.trim();
  const keyConfigured = expected.length > 0;
  const keyHadWhitespace = raw.length !== expected.length;

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const provided = (req.headers.get("x-api-key") ?? bearer ?? "").trim();
  const keyMatch = provided ? provided === expected : null;

  const keyPreview =
    expected.length >= 8
      ? `${expected.slice(0, 4)}…${expected.slice(-4)}`
      : keyConfigured
        ? "set"
        : null;

  let db_: { connected: boolean; error: string | null } = {
    connected: false,
    error: null,
  };
  try {
    await db.$queryRaw`SELECT 1`;
    db_ = { connected: true, error: null };
  } catch (e) {
    db_ = { connected: false, error: e instanceof Error ? e.message : "db error" };
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        keyConfigured,
        keyLength: expected.length,
        keyHadWhitespace,
        keyPreview,
        keyMatch,
        db: db_,
        deployedAt: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      },
    },
    { headers: CORS_HEADERS }
  );
}

export function OPTIONS() {
  return corsPreflight();
}
