// Postgres-flavored helpers. Postgres returns native `string[]` and parsed `Json`,
// so these are passthrough/identity (kept as named functions to minimize the diff
// against the SQLite version, where they JSON-(de)serialized String columns).

import type { Prisma } from "@prisma/client";

export function parseStringArray(value: string[] | null | undefined): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function serializeStringArray(arr: string[] | undefined | null): string[] {
  return Array.isArray(arr) ? arr : [];
}

export function parseJsonField<T = unknown>(value: T | null | undefined): T | null {
  return value ?? null;
}

// For a nullable `Json?` column, return `undefined` (omit → DB null) rather than a
// literal `null`, which Prisma rejects for Json fields.
export function serializeJsonField(
  value: unknown
): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return value as Prisma.InputJsonValue;
}
