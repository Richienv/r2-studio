# R2·STUDIO

Content operations system for the 365-day reel project. Part of the R2·OS ecosystem.

**Status:** V1. Active DB is **Neon Postgres** (the SQLite→Postgres swap has been applied — see below). Hermes/Ren HTTP integration live under `/api/hermes/*`.

## Stack

- Next.js 14 (App Router, TS)
- Prisma 5 ORM
- SQLite (dev) → Neon Postgres (prod)
- TanStack Query (polling 10s)
- Tailwind CSS, Bebas Neue + DM Sans + DM Mono

## Run locally

```bash
npm install
npm run db:push      # creates prisma/dev.db
npm run db:seed      # seeds 7 pillars + opinions
npm run dev          # http://localhost:3000
```

## Scripts

| script              | purpose                       |
| ------------------- | ----------------------------- |
| `npm run dev`       | Dev server, hot reload        |
| `npm run build`     | Production build              |
| `npm run start`     | Run prod build                |
| `npm run typecheck` | `tsc --noEmit`                |
| `npm run db:push`   | Sync schema to db             |
| `npm run db:seed`   | Run `prisma/seed.ts`          |
| `npm run db:studio` | Open Prisma Studio            |

## Screens

| Path        | Purpose                                                       |
| ----------- | ------------------------------------------------------------- |
| `/`         | TODAY — Day X/365, streak, today's reel, week mini-grid       |
| `/pipeline` | List view, tap-status-to-cycle, detail drawer                 |
| `/ideas`    | IDE / OPINI tabs, promote-to-reel, archive                    |
| `/library`  | B-roll grid by category, mark-used                            |

## API

All mutations require `x-api-key` for cross-origin clients (Hermes/curl). Same-origin browser calls bypass via `sec-fetch-site: same-origin`.

### Public reads (no key)

- `GET /api/summary` — R2·OS hub contract: `{ metric, unit, label, highlight, trend, lastUpdated }` (**never change this shape**)
- `GET /api/today` · `GET /api/week?startDate=` · `GET /api/streak`
- `GET /api/pillars` — pillars **+ `keywords[]`** so Ren maps NL → pillar id
- `GET /api/categories` — entry types, reel-status vocabulary (Ren word → real status), b-roll categories
- `GET /api/library?tag=&category=` — b-roll list in `{ ok, data:{ count, items } }`
- `GET /api/ideas` · `GET /api/opinions` · `GET /api/reels`
- `GET /api/hermes/health` — key config (no leak) + db connectivity + deployed sha + `keyMatch`

### Mutating

- `POST /api/reels` (auto-assigns next dayNumber)
- `PATCH /api/reels/:id` / `PATCH /api/reels/:id/status` / `DELETE /api/reels/:id`
- `POST /api/ideas` / `PATCH /api/ideas/:id` / `POST /api/ideas/:id/promote`
- `POST /api/opinions` / `PATCH /api/opinions/:id` / `POST /api/opinions/:id/use`
- `POST /api/broll` / `PATCH /api/broll/:id/use`

### Hermes (auth: `x-api-key` or `Authorization: Bearer`; `{ ok, data }` / `{ ok, error, message }`)

- `POST /api/hermes/capture` — NL router **or** structured `{ text, type:"IDEA"|"OPINION", pillar:"<id|name>", title?, tags? }`. Returns `classifiedBy: "ren"|"heuristic"`. (Legacy `{text,forceKind,pillarHint}` still works.)
- `POST /api/hermes/log-reel` — `{ hook, pillar, dayNumber?, status?, scheduledFor?, brollIds?, notes? }`
- `POST /api/hermes/promote-idea` — `{ ideaId, scheduledFor?, hookOverride? }`
- `POST /api/hermes/update-status` — `{ reelId, status, postedUrl? }` (maps DRAFT/SCHEDULED/POSTED/ARCHIVED → real pipeline status)
- `POST /api/hermes/log-broll` — `{ url|note, tags[], pillarHint? }`
- `POST /api/hermes/brief` — `{ type: "today"|"week"|"capture-prompt"|"film-prompt" }` → tight Indonesian `text`
- `POST /api/hermes/status` — legacy Ren-friendly status string (unchanged)

Status vocabulary map (Ren → reel.status): `DRAFT→idea`, `SCHEDULED→scripted`, `FILMED→filmed`, `EDITED→edited`, `POSTED→posted`, `ARCHIVED→archived`.

Auth model: all reads are public; mutations require the key **unless** same-origin (the browser UI). Key compare trims whitespace (Vercel env newline gotcha) and accepts `Bearer`. Full CRUD incl. `DELETE /api/broll/:id` exists for test-data cleanup.

## Neon Postgres (swap APPLIED)

The SQLite→Postgres swap described here has been executed on this branch:

1. ✅ `prisma/schema.prisma` is now the Postgres schema (canonical copy kept at `prisma/schema.postgres.prisma`).
2. ✅ `lib/json-array.ts` helpers are passthrough (Postgres returns real `string[]` / `Json`).
3. ✅ `lib/serializers.ts` row types widened to `string[]` / `Json`; `lib/api.ts` + `lib/mcp-tools.ts` write `payload` as `Json`; seeds use native arrays.
4. ✅ `build` script runs `prisma generate && prisma db push --skip-generate || … && next build` — so newly-added models are always in the generated client at runtime (the lesson: plain `next build` skips `prisma generate` and agent writes crash in prod).

Remaining (provision side): set `DATABASE_URL` (pooled) + `DIRECT_URL` (direct) in Vercel (Production + Preview), then `npm run db:seed` against Neon so the dashboard isn't empty.

To run **locally on SQLite** instead, restore `provider="sqlite"` + the JSON-string helpers (see `.env.example`).

## Deploy (Vercel)

```bash
gh repo create r2-studio --public --source=. --push
vercel link
vercel env add R2_STUDIO_API_KEY    # generate a fresh 32-char key
vercel env add DATABASE_URL          # Neon pooled URL
vercel env add DIRECT_URL            # Neon direct URL
vercel --prod
```

Target alias: `r2-studio.vercel.app`. Add Deployment Protection → Password in Vercel project settings.

## R2·OS hub integration

After deploy, edit the R2·OS hub `app/api/proxy/[app]/route.ts`:

```ts
const APPS = {
  // ...
  'studio': 'https://r2-studio.vercel.app',
};
```

Hub will proxy `https://r2-os.vercel.app/api/proxy/studio` → R2·STUDIO's `/api/summary`.

## Hermes MCP config

Once deployed, paste into your Hermes MCP server config on the Mac Mini:

```json
{
  "mcpServers": {
    "r2-studio": {
      "type": "http",
      "url": "https://r2-studio.vercel.app/api",
      "headers": {
        "x-api-key": "<R2_STUDIO_API_KEY>",
        "x-actor": "hermes-ren"
      }
    }
  }
}
```

V1 has no `/api/mcp` wrapper — Hermes calls the REST routes directly with the API key.

## Out of scope V1

Metrics dashboard, IG/TikTok API, AI hooks, multi-user, email, calendar export, realtime sockets, light mode. See `docs/r2-studio-build-prompt.md` for full constraints.
