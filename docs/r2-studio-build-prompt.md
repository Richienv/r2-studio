---
title: R2·STUDIO — Claude Code Build Prompt (V1, ready-to-paste)
type: claude-code-prompt
project: R2·OS Ecosystem
target-deploy: r2-studio.vercel.app
created: 2026-05-26
tags: [r2-studio, claude-code, build-prompt, ready-to-execute]
companion-spec: r2-studio-spec.md
estimated-build-time: 3 days focused / 5-6 days interleaved
---

# R2·STUDIO — Claude Code Build Prompt

Paste prompt di bawah ke Claude Code terminal di repo baru `r2-studio`. Eksekusi sekaligus, jangan dipecah — Claude Code akan handle multi-step build sesuai instruksi.

Pre-flight: bikin repo kosong `r2-studio` di GitHub + Vercel project + Neon database baru sebelum paste.

---

## ENVIRONMENT VARIABLES YANG PERLU DISIAPIN

```bash
# .env.local (jangan commit)
DATABASE_URL="postgresql://...neon..."     # dari Neon dashboard
DIRECT_URL="postgresql://...neon..."        # dari Neon dashboard (untuk migrations)
R2_STUDIO_API_KEY="generate-random-32char"  # untuk Hermes auth
NEXT_PUBLIC_APP_URL="https://r2-studio.vercel.app"
```

Set juga di Vercel Project Settings → Environment Variables.

---

## CLAUDE CODE PROMPT (paste persis ini)

```
Build R2·STUDIO — content operations system untuk 365-day reel project. Bagian dari R2·OS ecosystem (R2·FIT, R2·SCHOOL, R2·FINANCE, R2·BUILD). Match design system + tech stack + convention dari R2 family existing.

## TECH STACK (locked, match R2 family)

- Next.js 14 App Router (TypeScript)
- Prisma ORM
- Neon Postgres (DATABASE_URL + DIRECT_URL env vars)
- Tailwind CSS + shadcn/ui minimal usage
- TanStack Query (untuk data fetching + polling)
- Lucide-react icons
- Deploy: Vercel (target: r2-studio.vercel.app)
- Mobile-first, fixed viewport (100dvh, no scroll on main screens)

JANGAN pakai Supabase. JANGAN pakai realtime channels. Polling via TanStack Query refetchInterval 10s.

## DESIGN SYSTEM (locked, match R2·FIT / R2·SCHOOL)

```css
/* tailwind.config.ts extend */
colors: {
  bg: '#0a0a0a',
  surface: '#111111',
  border: '#222222',
  accent: '#e8ff47',      // volt yellow
  success: '#47ffb8',     // mint
  danger: '#ff4747',      // red
  muted: '#666666',
  text: '#ffffff',
  textDim: '#888888',
}
```

Typography:
- Display font: 'Bebas Neue' (Google Fonts) — untuk numbers, headers, day counters
- Body font: 'DM Sans' (Google Fonts) — body text, labels
- Mono font: 'DM Mono' (Google Fonts) — stats, codes, timestamps

Borders: `border: 0.5px solid #222`. NEVER 1px. NEVER rounded > rounded-md (8px). Sharp aesthetic.

Spacing: tight. Padding 12-16px typical. Mobile-first.

## PRISMA SCHEMA (lock ini, jangan modif tanpa konfirmasi)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Pillar {
  id          String   @id @default(cuid())
  name        String
  dayOfWeek   Int      @unique
  colorMode   String
  description String
  createdAt   DateTime @default(now())

  ideas       Idea[]
  reels       Reel[]
}

model Idea {
  id               String   @id @default(cuid())
  content          String   @db.Text
  pillarId         String?
  pillar           Pillar?  @relation(fields: [pillarId], references: [id])
  status           String   @default("draft")
  source           String   @default("manual")
  tags             String[] @default([])
  notes            String?  @db.Text
  promotedToReelId String?  @unique
  reel             Reel?    @relation(fields: [promotedToReelId], references: [id])
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([status])
  @@index([pillarId, status])
}

model Reel {
  id                   String    @id @default(cuid())
  dayNumber            Int       @unique
  scheduledDate        DateTime
  pillarId             String
  pillar               Pillar    @relation(fields: [pillarId], references: [id])
  hook                 String?   @db.Text
  act1Broll            String?   @db.Text
  act2Script           String?   @db.Text
  act3Payoff           String?   @db.Text
  cta                  String?   @default("Link di bio · 1.000 seat launch")
  musicVibe            String?
  textOverlays         Json?
  brollList            String[]  @default([])
  status               String    @default("idea")
  filmedAt             DateTime?
  editedAt             DateTime?
  postedAt             DateTime?
  igUrl                String?
  tiktokUrl            String?
  notes                String?   @db.Text
  estimatedDurationSec Int?      @default(45)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  idea                 Idea?

  @@index([status])
  @@index([scheduledDate])
}

model Opinion {
  id           String   @id @default(cuid())
  content      String   @db.Text
  context      String?  @db.Text
  tags         String[] @default([])
  status       String   @default("fresh")
  usedInReelId String?
  createdAt    DateTime @default(now())

  @@index([status])
}

model BrollClip {
  id          String    @id @default(cuid())
  tag         String    @unique
  filePath    String
  duration    Float
  category    String
  description String?
  usedCount   Int       @default(0)
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())

  @@index([category])
}

model ActivityLog {
  id         String   @id @default(cuid())
  actor      String
  action     String
  entityId   String?
  entityType String?
  payload    Json?
  createdAt  DateTime @default(now())

  @@index([actor, createdAt])
}
```

Run `npx prisma db push` setelah schema. JANGAN pakai migrate dev — db push aja untuk early dev.

## SEED DATA (auto-run setelah db push)

Script di `prisma/seed.ts`. Tambahin `"prisma": { "seed": "tsx prisma/seed.ts" }` ke package.json.

```ts
// prisma/seed.ts
const pillars = [
  { name: "BELAJAR",  dayOfWeek: 1, colorMode: "M1-Workspace-Warm",   description: "Knowledge drop dari hari itu — coding, GMBA class, AI insight." },
  { name: "MINDSET",  dayOfWeek: 2, colorMode: "M3-Manifesto-Cinema", description: "Opini contrarian. Authority-building. Daley-style cinematic." },
  { name: "BUILD",    dayOfWeek: 3, colorMode: "M1-Workspace-Warm",   description: "weuseai.agent progress, demo, screen recording." },
  { name: "STRUGGLE", dayOfWeek: 4, colorMode: "M1-Workspace-Warm",   description: "Vulnerability. Yang gagal, yang frustasi, real talk." },
  { name: "HANGZHOU", dayOfWeek: 5, colorMode: "M2-Outdoor-Cool",     description: "GMBA + China life + cultural observations." },
  { name: "MANDARIN", dayOfWeek: 6, colorMode: "M2-Outdoor-Cool",     description: "HSK 4→6 journey. Learning hacks. AI + Mandarin." },
  { name: "VISION",   dayOfWeek: 7, colorMode: "M3-Manifesto-Cinema", description: "Manifesto. Highest production. Generational take." },
];

const opinions = [
  { content: "Building in public has symmetric returns — downside kecil (orang respect attempt), upside besar (built-in audience + credibility + customers).", context: "Naval-style asymmetric framing applied to creator-founder life.", tags: ["building-in-public", "philosophy", "asymmetric"] },
  { content: "AI bukan ChatGPT. AI adalah agent stack — research agent, content agent, planning agent, food agent. Yang masih pake satu tool masih di era lama.", context: "Hermes stack (6 sub-agents), weuseai.agent (9 production agents), ERP bug daemon. 3 tahun ahead dari rata-rata founder Indo.", tags: ["ai", "agents", "indonesia"] },
  { content: "Volume > one-shot perfection. Do, don't think. Cost mencoba 100 hal dan 95 gagal lebih kecil dari cost overthinking 5 hal.", context: "Bias to action. Stop planning, start shipping.", tags: ["mindset", "execution", "doer"] },
  { content: "Generasi kita gak boleh cuma jadi penonton — harus participate di digital era + digital money wave. Sisanya 10 tahun. Most akan spectate, sedikit yang build.", context: "Generational manifesto. Indonesia specifically lagi ketinggalan wave AI.", tags: ["generational", "manifesto", "indonesia", "ai"] },
];

// Seed both, ignore conflicts.
```

## API ROUTES (semua di app/api/)

Pakai zod untuk validation. API key check middleware untuk semua POST/PATCH/DELETE.

### Middleware

`middleware.ts` di root:

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Public read endpoints (no key)
  const publicPaths = ['/api/summary', '/api/today', '/api/week', '/api/streak'];
  const isPublic = publicPaths.some(p => req.nextUrl.pathname.startsWith(p));

  // Only check key on mutations
  const isMutation = ['POST', 'PATCH', 'DELETE'].includes(req.method);
  if (!isMutation || isPublic) return NextResponse.next();

  // Skip for /api/proxy or similar
  if (!req.nextUrl.pathname.startsWith('/api/')) return NextResponse.next();

  const key = req.headers.get('x-api-key');
  if (key !== process.env.R2_STUDIO_API_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
```

### Endpoints (implement semua)

```
GET    /api/summary                # R2·OS hub integration — see shape below
GET    /api/today                  # filming + posting tasks + streak
GET    /api/week?startDate=        # next 7 days
GET    /api/streak                 # current consecutive posting streak

GET    /api/reels?status=&pillar=&from=&to=&limit=
POST   /api/reels                  # auto-assign next dayNumber if not provided
GET    /api/reels/:id
PATCH  /api/reels/:id
DELETE /api/reels/:id
PATCH  /api/reels/:id/status       # dedicated status transition

GET    /api/ideas?pillar=&status=&tags=
POST   /api/ideas
PATCH  /api/ideas/:id
DELETE /api/ideas/:id
POST   /api/ideas/:id/promote      # idea → reel

GET    /api/opinions?status=
POST   /api/opinions
PATCH  /api/opinions/:id
POST   /api/opinions/:id/use

GET    /api/broll?category=&tag=
POST   /api/broll
PATCH  /api/broll/:id/use          # increment usedCount + lastUsedAt

POST   /api/hermes/capture         # natural language → auto-classify idea/opinion
POST   /api/hermes/brief           # { type: "today" | "week" | "filming-day" }
POST   /api/hermes/status          # Ren-friendly status update
```

### /api/summary shape (CRITICAL — R2·OS hub consumes this)

```ts
GET /api/summary
{
  "metric": "47/365",                    // Bebas Neue display
  "unit": "DAYS",                        // DM Mono small caps
  "label": "DAY 47 · STREAK 12 · 3 PENDING",  // DM Mono small caps
  "highlight": "FILMING: BUILD · The Pro demo",  // Optional accent line
  "trend": "up",                         // "up" | "down" | "flat" — for streak indicator
  "lastUpdated": "2026-05-26T08:00:00Z"
}
```

Compute:
- `metric`: current dayNumber / 365 (find max dayNumber from posted reels + 1)
- `streak`: consecutive days posted up to today
- `pending`: count of reels with status in ['idea','scripted','filmed'] scheduled in next 7 days
- `highlight`: today's reel pillar + hook (truncated 30 chars)

This is the contract dengan R2·OS hub. JANGAN ubah shape.

### /api/hermes/capture — natural language router

Body: `{ text: string, source?: "telegram" | "voice" | "claude" }`

Logic:
1. Run text through simple classifier (keyword heuristic, no LLM needed di V1):
   - Contains kata kunci ["kenapa", "menurut gue", "harus", "salah ngerti", "contrarian"] → Opinion
   - Default → Idea
2. Classify pillar via keywords:
   - "demo", "feature", "agent", "ship", "build" → BUILD
   - "belajar", "insight", "kelas", "today I learned" → BELAJAR
   - "frustasi", "gagal", "bug", "stuck" → STRUGGLE
   - "hangzhou", "china", "campus", "ZJU" → HANGZHOU
   - "HSK", "mandarin", "中文" → MANDARIN
   - "vision", "generation", "future", "manifesto" → VISION
   - "mindset", "opini", "menurut" → MINDSET
   - Else: null (no pillar)
3. Save ke right table, log to ActivityLog with actor="hermes-ren"
4. Return: `{ saved: true, entity: {...}, classification: "idea-build" }`

## SCREENS (mobile-first fixed viewport, 4 screens total)

### SCREEN 1 — TODAY (default landing) `/`

100dvh, no scroll. Fixed layout. Match R2·OS hub aesthetic.

Layout (top to bottom):
- **Top bar**: "R2·STUDIO" left (Bebas Neue 18px), settings icon right
- **Hero number** (big): Day X (Bebas Neue 120px volt yellow), "/365" subscript Bebas Neue 32px dim
- **Streak strip**: `🔥 12 DAY STREAK` (DM Mono uppercase letter-spacing, mint color)
- **Today's reel card** (border, padded):
  - Pillar tag pill (BUILD/MINDSET/etc) in volt yellow
  - Hook line (DM Sans 16px white)
  - Status pill (idea/scripted/filmed/edited/posted) bottom right
  - Tap → opens drawer with full details
- **This week mini-grid**: 7 cells horizontal, each cell shows pillar tag + day# + status dot color
- **FAB (floating action button)**: bottom right, volt yellow, "+" icon → opens quick capture modal

Quick capture modal:
- Single textarea full-width
- Two buttons: "IDE" / "OPINI" (toggle which table to save to)
- Pillar dropdown (optional, auto if blank)
- Submit → save → toast confirm → close

### SCREEN 2 — PIPELINE `/pipeline`

Scrollable list view (this screen CAN scroll). Match R2·SCHOOL timeline pattern.

- Top filter bar: status pills (ALL / IDEA / SCRIPTED / FILMED / EDITED / POSTED), pillar dropdown
- List items, each row:
  - Day # (Bebas Neue 36px, left)
  - Pillar tag pill below day#
  - Hook (DM Sans 14px, 2-line clamp)
  - Status pill right side — TAP TO CYCLE: idea → scripted → filmed → edited → posted → idea
  - Scheduled date small (DM Mono dim)
- Long-press row → opens detail drawer

Detail drawer (bottom sheet on mobile, modal on desktop):
- All script fields editable (hook, act1Broll, act2Script, act3Payoff, cta, musicVibe)
- B-roll multi-select from library
- Notes textarea
- Save / Cancel / Delete buttons
- Status timeline visualization (5 dots, filled up to current)

### SCREEN 3 — IDEAS `/ideas`

Tab toggle at top: IDEAS | OPINIONS

Card stack (swipeable on mobile, grid on desktop):
- Each card: content (DM Sans 16px), pillar tag, status, source badge, age (DM Mono)
- Swipe right (mobile) / Click "→ REEL" (desktop): promote to new reel
- Swipe left (mobile) / Click "ARCHIVE": status → archived
- Tap: expand to full view + edit

Add new at top: textarea + pillar dropdown + save button.

### SCREEN 4 — LIBRARY `/library`

B-roll grid view.

- Filter chips by category: WORKSPACE, OUTDOOR-HANGZHOU, MAC-SCREEN, MANDARIN, LIFESTYLE, POV-WALKING, CAMPUS-ZJU
- Grid 2 col mobile, 4 col desktop
- Each tile: tag (DM Mono), duration, usedCount badge (red if > 3, dim if 0)
- Tap: detail view with file path, description, "mark used" button

Add new clip form at top: tag, filePath, duration, category, description.

## NAVIGATION

Bottom nav bar mobile (fixed bottom, 4 icons + labels):
- TODAY (home icon)
- PIPELINE (list icon)  
- IDEAS (lightbulb icon)
- LIBRARY (film icon)

Desktop: left sidebar 200px, same items.

## POLLING SETUP

TanStack Query default config:
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 10_000, // 10s polling
      refetchOnWindowFocus: true,
      staleTime: 5_000,
    },
  },
});
```

Apply to all `useQuery` calls. UI auto-updates when Ren modifies data via API.

## ACTIVITY LOGGING

Every mutation (POST/PATCH/DELETE) → write ActivityLog entry with:
- actor: parse from `x-actor` header (default "richie-web" if missing, "hermes-ren" if Hermes calls)
- action: "{entity}.{verb}" e.g. "reel.created", "idea.promoted"
- entityId + entityType
- payload: full request body (sanitize sensitive fields)

## BUILD ORDER (for Claude Code to follow)

1. Init Next.js 14 app with TypeScript, App Router, Tailwind
2. Install: prisma @prisma/client zod @tanstack/react-query lucide-react tsx
3. Setup shadcn/ui (init only — add components as needed)
4. Configure tailwind.config.ts with R2 color tokens + Google Fonts (Bebas Neue, DM Sans, DM Mono)
5. Write prisma/schema.prisma, run `npx prisma db push`
6. Write prisma/seed.ts, run `npx prisma db seed`
7. Build middleware.ts (API key check)
8. Build all API routes (start with /api/summary, /api/today, then CRUDs)
9. Build /api/hermes/capture with keyword classifier
10. Build SCREEN 1 (Today) — make it polish, this is the landing
11. Build SCREEN 2 (Pipeline) with tap-to-cycle status
12. Build SCREEN 3 (Ideas) with swipe gestures (use framer-motion atau use-gesture)
13. Build SCREEN 4 (Library)
14. Bottom nav (mobile) + sidebar (desktop)
15. Deploy to Vercel, set env vars
16. Add Vercel password protection (Project Settings → Deployment Protection → Password)
17. Output: deployed URL + API key + 10 curl commands to test all endpoints

## CONSTRAINTS

- All UI strings in Indonesian (aku/kamu register, gen-Z, casual). UPPERCASE untuk DM Mono labels (R2 family convention).
- NEVER 1px borders. Always 0.5px solid #222.
- NEVER pakai shadcn Button default styling — override dengan R2 design system.
- Mobile-first. Test di 375px width first.
- Bottom nav has safe-area-inset-bottom padding (iPhone notch).
- Dark mode only (no light mode toggle for V1 — R2 family is dark-only).
- Run `npx tsc --noEmit` before commit. Fix all type errors.

## OUT OF SCOPE V1 (jangan dibangun)

- Metrics dashboard (views, likes, saves)
- IG/TikTok API integration
- AI-generated hooks atau scripts
- Multi-user / team features
- Email notifications
- Calendar export (iCal)
- Real-time websockets / SSE (polling cukup)
- Light mode

## DELIVERABLES

After build complete, output ke chat:
1. Deployed URL (e.g. https://r2-studio.vercel.app)
2. Generated R2_STUDIO_API_KEY (random 32 char)
3. 10 curl commands testing setiap endpoint critical
4. Screenshots dari 4 screens (kalau memungkinkan)
5. Migration command untuk R2·OS hub: cara tambahin r2-studio card ke proxy route
6. Hermes MCP tool config snippet (siap copy ke Mac Mini Hermes)

Mulai. Ship sebelum Sunday template build.
```

---

## R2·OS HUB INTEGRATION PATCH

Setelah R2·STUDIO live, edit R2·OS hub:

1. **Edit `app/api/proxy/[app]/route.ts`** di R2·OS repo — tambahin mapping:
   ```ts
   const APPS = {
     'fit': 'https://r2-fit.vercel.app',
     'school': 'https://r2-school.vercel.app',
     'finance': 'https://r2-finance.vercel.app',
     'build': 'https://r2-build.vercel.app',
     'studio': 'https://r2-studio.vercel.app', // ← tambah ini
   };
   ```

2. **Edit hub UI** untuk show R2·STUDIO card sebagai card ke-5. Gunakan ikon film/video lucide-react.

3. **Test:** hit `https://r2-os.vercel.app/api/proxy/studio` — harus return shape `/api/summary` dari R2·STUDIO.

---

## HERMES MCP TOOL CONFIG (untuk Mac Mini)

Setelah R2·STUDIO deployed, paste config ini ke Hermes MCP server config file:

```json
{
  "mcpServers": {
    "r2-studio": {
      "type": "http",
      "url": "https://r2-studio.vercel.app/api/mcp",
      "headers": {
        "x-api-key": "<R2_STUDIO_API_KEY>",
        "x-actor": "hermes-ren"
      },
      "tools": [
        "studio_today_brief",
        "studio_week_view",
        "studio_capture_idea",
        "studio_capture_opinion",
        "studio_create_reel",
        "studio_update_reel_status",
        "studio_get_ideas",
        "studio_get_opinions",
        "studio_streak"
      ]
    }
  }
}
```

Note: build prompt ini gak include `/api/mcp` endpoint karena MCP server bisa diimplementasikan separate (HTTP wrapper around the API routes). Bisa di-iterate setelah V1 ship — minimal version: Hermes calls existing API routes langsung dengan x-api-key header, no MCP wrapper needed.

---

## TESTING CHECKLIST (post-deploy)

```bash
# Pakai $URL = deployed Vercel URL, $KEY = R2_STUDIO_API_KEY

# 1. Public endpoints (no key)
curl $URL/api/summary
curl $URL/api/today
curl $URL/api/streak

# 2. Capture idea via Hermes endpoint
curl -X POST $URL/api/hermes/capture \
  -H "x-api-key: $KEY" \
  -H "x-actor: hermes-ren" \
  -H "Content-Type: application/json" \
  -d '{"text": "Building in public itu compounding interest — invisible di hari 10, gila di hari 100"}'

# 3. Create reel
curl -X POST $URL/api/reels \
  -H "x-api-key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"pillarId": "<PILLAR_ID>", "scheduledDate": "2026-05-31", "hook": "Day 1 of 365"}'

# 4. Update status
curl -X PATCH $URL/api/reels/<REEL_ID>/status \
  -H "x-api-key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"newStatus": "scripted"}'

# 5. Get ideas filtered
curl "$URL/api/ideas?pillar=mindset&status=ready"

# 6. Browse opinions
curl $URL/api/opinions?status=fresh

# 7. R2·OS hub fetch
curl https://r2-os.vercel.app/api/proxy/studio
```

Semua harus return 200 dengan valid JSON. Kalau ada yang 500, fix sebelum dogfood.

---

## POST-BUILD: FIRST WEEK USAGE

Setelah deploy:

**Hari 1-2:** Manually seed 7 reel slots untuk minggu pertama (1 per pillar). Pakai web UI atau curl.

**Hari 3:** Test Hermes capture flow — say to Ren "capture idea: [text]", verify muncul di dashboard.

**Hari 4-7:** Dogfood. Buka dashboard tiap pagi, ngomong ke Ren tiap dapet ide.

**Hari 8+:** Sunday batch — promote ideas → reels, schedule 7 reel buat minggu depan. First real test of the system.

**Hari 30:** Retro. Lihat ActivityLog — pattern apa yang muncul. Decide V2 priority based on actual friction.

---

## FALLBACK PLAN (kalau build stuck)

Kalau Day 1-2 backend stuck di Neon connection issue atau Prisma error, fallback options:

1. **Option A:** Pakai SQLite local untuk dev (1-line schema.prisma change), migrate ke Neon Day 3
2. **Option B:** Pakai Vercel Postgres (instant setup, same Prisma syntax)
3. **Option C:** Reuse one of R2 family's existing Neon database, namespace tabel dengan prefix `studio_` — risky tapi cepet

Default tetep Neon fresh project. Recommendation: jangan re-use R2·FINANCE atau R2·SCHOOL database — isolation > convenience.

---

Final note: spec ini opinionated dan locked. Resist customization at build time. Ship V1 as-spec, iterate setelah 30 hari real usage. Itu gunanya build prompt yang detailed — supaya Claude Code execute tanpa ambiguity.
