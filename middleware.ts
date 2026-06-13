import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public GET routes (no key). Reads are public everywhere — this list also
// documents the vocabulary/hub surface Hermes hits unauthenticated.
const PUBLIC_PATHS = [
  "/api/summary",
  "/api/today",
  "/api/week",
  "/api/streak",
  "/api/pillars",
  "/api/categories",
  "/api/library",
  "/api/ideas",
  "/api/opinions",
  "/api/reels",
  "/api/hermes/health",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/api/")) return NextResponse.next();

  const isPublicRead =
    req.method === "GET" && PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublicRead) return NextResponse.next();

  const isMutation = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method);
  if (!isMutation) return NextResponse.next(); // GET/HEAD/OPTIONS pass freely

  // Same-origin browser requests are the trusted UI client (sends no key).
  // External clients (Hermes, curl) must authenticate.
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin") return NextResponse.next();

  // Accept either `x-api-key: <key>` or `Authorization: Bearer <key>`.
  // KEY-COMPARE LESSON: Vercel env vars pasted from the dashboard often carry an
  // invisible trailing newline; exact compare 401s with the right key. Trim both.
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const key = (req.headers.get("x-api-key") ?? bearer ?? "").trim();
  const expected = (process.env.R2_STUDIO_API_KEY ?? "").trim();

  if (!key || !expected || key !== expected) {
    return NextResponse.json(
      { ok: false, error: "unauthorized", message: "Invalid or missing x-api-key" },
      { status: 401 }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
