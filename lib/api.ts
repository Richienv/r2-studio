import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export function notFound(entity = "resource") {
  return NextResponse.json({ error: `${entity} not found` }, { status: 404 });
}

export function getActor(req: NextRequest): string {
  return req.headers.get("x-actor") || "richie-web";
}

export async function logActivity(opts: {
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
  } catch (e) {
    console.error("activity log error", e);
  }
}

export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    return NextResponse.json(
      { error: "validation_error", issues: e.issues },
      { status: 400 }
    );
  }
  console.error(e);
  const msg = e instanceof Error ? e.message : "internal_error";
  return NextResponse.json({ error: msg }, { status: 500 });
}

// ── Hermes/Ren shared conventions ──────────────────────────────────────────
// New endpoints (everything under /api/hermes/* + the vocabulary GETs) use a
// uniform envelope { ok:true, data } / { ok:false, error, message } plus CORS +
// no-store, because Hermes calls cross-origin. Existing routes keep their shapes.

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, x-api-key, x-actor, authorization",
  "Cache-Control": "no-store",
};

export function dataOk<T>(payload: T, status = 200) {
  return NextResponse.json(
    { ok: true, data: payload },
    { status, headers: CORS_HEADERS }
  );
}

export function dataErr(error: string, message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error, message },
    { status, headers: CORS_HEADERS }
  );
}

export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function handleHermesError(e: unknown) {
  if (e instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: "validation-error",
        message: "Request body failed validation",
        issues: e.issues,
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }
  console.error(e);
  const msg = e instanceof Error ? e.message : "internal error";
  return NextResponse.json(
    { ok: false, error: "internal-error", message: msg },
    { status: 500, headers: CORS_HEADERS }
  );
}
