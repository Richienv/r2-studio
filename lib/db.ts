import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// On Vercel serverless, prefer Neon's pgbouncer-ready pooled URL
// (POSTGRES_PRISMA_URL has ?pgbouncer=true) so Prisma disables prepared
// statements — otherwise concurrent agent writes can hit
// "prepared statement already exists" under PgBouncer transaction pooling.
// Locally (no POSTGRES_PRISMA_URL) Prisma falls back to the schema's DATABASE_URL.
const prismaUrl = process.env.POSTGRES_PRISMA_URL;

export const db =
  global.prisma ??
  new PrismaClient({
    ...(prismaUrl ? { datasourceUrl: prismaUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = db;
