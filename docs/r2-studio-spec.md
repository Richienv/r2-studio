---
title: R2·STUDIO — Content Operations System
type: project-spec
project: R2·OS Ecosystem
created: 2026-05-26
tags: [r2os, content, reels, hermes-integration, mvp-spec]
status: ready-to-build
target-ship: 2-3 hari (V1 minimal viable)
related: weuseai.agent, Hermes Agent Stack, 365-Reel Template
---

# R2·STUDIO — Content Operations System

Operating system buat 365-day reel project. API-first, Hermes-native, minimal UI. Build V1 dalam 2-3 hari sebelum content production scaling, supaya ide/script/schedule gak hilang di chat history.

---

## 1. Strategic Decisions (lock dulu, jangan debate lagi)

- **V1 scope:** ideas bank + reels pipeline + schedule view + Hermes MCP integration. Itu doang.
- **V1 NOT scope:** metrics dashboard, IG/TikTok auto-sync, AI hook generator, leaderboard, multi-platform analytics. V2 after 30 reels of real data.
- **Single user.** No auth UI, no team features. API key untuk Hermes, Vercel password protection untuk web UI.
- **Hermes is the primary interface.** Web UI is read-mostly command center. Voice/Telegram → Ren → API = daily driver.
- **Realtime via Supabase channels** untuk update UI saat Ren modify data.
- **Stack reuse:** Next.js 14 App Router + Supabase + Prisma + Vercel + shadcn/ui. Sama dengan ERP stack — zero learning curve.

---

## 2. Data Model (Prisma schema)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────────
// PILLARS — 7-day content rotation
// Seeded sekali, jarang berubah.
// ─────────────────────────────────────────────────
model Pillar {
  id          String   @id @default(cuid())
  name        String   // "Belajar", "Mindset", "Build", "Struggle", "Hangzhou", "Mandarin", "Vision"
  dayOfWeek   Int      // 1=Senin, 7=Minggu
  colorMode   String   // "M1-Workspace-Warm" | "M2-Outdoor-Cool" | "M3-Manifesto-Cinema"
  description String
  createdAt   DateTime @default(now())

  ideas       Idea[]
  reels       Reel[]

  @@unique([dayOfWeek])
}

// ─────────────────────────────────────────────────
// IDEAS — capture mentah dari Hermes voice / web
// Pre-script. Bisa di-promote jadi Reel kapan aja.
// ─────────────────────────────────────────────────
model Idea {
  id          String   @id @default(cuid())
  content     String   @db.Text       // hook/angle/opini mentah
  pillarId    String?
  pillar      Pillar?  @relation(fields: [pillarId], references: [id])
  status      String   @default("draft") // draft | ready | scheduled | used | archived
  source      String   @default("manual") // manual | hermes-voice | hermes-ai | claude
  tags        String[] @default([])
  notes       String?  @db.Text
  promotedToReelId String? @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  reel        Reel?    @relation(fields: [promotedToReelId], references: [id])

  @@index([status])
  @@index([pillarId, status])
}

// ─────────────────────────────────────────────────
// REELS — pipeline utama. Each reel = one row.
// Status flow: idea → scripted → filmed → edited → posted
// ─────────────────────────────────────────────────
model Reel {
  id              String   @id @default(cuid())
  dayNumber       Int      @unique          // 1-365
  scheduledDate   DateTime
  pillarId        String
  pillar          Pillar   @relation(fields: [pillarId], references: [id])

  // Script content (3-act structure)
  hook            String?  @db.Text         // Act 1 hook line
  act1Broll       String?  @db.Text         // suggested cold-open B-roll
  act2Script      String?  @db.Text         // body talking head + B-roll cuts
  act3Payoff      String?  @db.Text         // closing payoff statement
  cta             String?  @default("Link di bio · 1.000 seat launch")
  musicVibe       String?                   // "lofi-warm" | "ambient-cool" | "cinematic-build"
  textOverlays    Json?                     // [{ time: "0:02", text: "...", style: "hook" }]
  brollList       String[] @default([])     // tag references ke B-roll library

  // Pipeline status
  status          String   @default("idea") // idea | scripted | filmed | edited | posted | skipped
  filmedAt        DateTime?
  editedAt        DateTime?
  postedAt        DateTime?

  // Post-publish references (no metrics V1, just URLs)
  igUrl           String?
  tiktokUrl       String?

  // Notes / retro
  notes           String?  @db.Text          // what worked, what didn't
  estimatedDurationSec Int? @default(45)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  idea            Idea?

  @@index([status])
  @@index([scheduledDate])
  @@index([pillarId, scheduledDate])
}

// ─────────────────────────────────────────────────
// OPINIONS BANK — contrarian takes untuk Mindset reels
// Separate dari Ideas karena ini "ammunition" reusable
// ─────────────────────────────────────────────────
model Opinion {
  id           String   @id @default(cuid())
  content      String   @db.Text
  context      String?  @db.Text             // background context / receipts
  tags         String[] @default([])
  status       String   @default("fresh")    // fresh | used | retired
  usedInReelId String?
  createdAt    DateTime @default(now())

  @@index([status])
  @@index([tags])
}

// ─────────────────────────────────────────────────
// B-ROLL LIBRARY — tag-able footage references
// Path points ke local filesystem, manual sync
// ─────────────────────────────────────────────────
model BrollClip {
  id          String   @id @default(cuid())
  tag         String   @unique             // "hand-typing-mac-01"
  filePath    String                       // "/365-Project/B-roll-Library/workspace/hand-typing-mac-01.mov"
  duration    Float                        // seconds
  category    String                       // "workspace" | "outdoor-hangzhou" | "mac-screen" | "mandarin-study" | "lifestyle" | "pov-walking" | "campus-zju"
  description String?
  usedCount   Int      @default(0)
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())

  @@index([category])
  @@index([usedCount])
}

// ─────────────────────────────────────────────────
// ACTIVITY LOG — audit trail untuk Hermes actions
// Useful buat retrospective + debug Ren behavior
// ─────────────────────────────────────────────────
model ActivityLog {
  id        String   @id @default(cuid())
  actor     String   // "hermes-ren" | "richie-web" | "claude" | "ai-aria"
  action    String   // "reel.created" | "idea.promoted" | "reel.status_changed"
  entityId  String?
  entityType String? // "reel" | "idea" | "opinion"
  payload   Json?
  createdAt DateTime @default(now())

  @@index([actor, createdAt])
  @@index([entityId])
}
```

---

## 3. API Endpoints (Next.js App Router)

Semua endpoint di `app/api/`. Auth: API key di header `x-api-key` (env: `R2_STUDIO_API_KEY`). Web UI same-origin so no key needed di server components.

### Reels

```ts
GET    /api/reels?status=&pillar=&from=&to=&limit=
POST   /api/reels                              // create new reel (auto next dayNumber)
GET    /api/reels/:id
PATCH  /api/reels/:id                          // partial update
DELETE /api/reels/:id
POST   /api/reels/:id/promote-from-idea/:ideaId
PATCH  /api/reels/:id/status                   // dedicated status transition endpoint
```

### Today & Schedule

```ts
GET    /api/today
// Returns: {
//   filming: Reel[] | null,    // reels with scheduledDate=today + status in [scripted]
//   posting: Reel[] | null,    // reels with scheduledDate=today + status=edited
//   posted: Reel[],            // already posted today
//   streak: number             // consecutive days posted
// }

GET    /api/week?startDate=    // next 7 days schedule
GET    /api/streak             // current consecutive posting streak
GET    /api/upcoming?limit=14  // next 14 reels in pipeline
```

### Ideas

```ts
GET    /api/ideas?pillar=&status=&tags=
POST   /api/ideas
PATCH  /api/ideas/:id
DELETE /api/ideas/:id
POST   /api/ideas/:id/promote  // converts idea → reel, links via promotedToReelId
```

### Opinions Bank

```ts
GET    /api/opinions?status=fresh
POST   /api/opinions
PATCH  /api/opinions/:id
POST   /api/opinions/:id/use   // marks used, links to reel
```

### B-roll Library

```ts
GET    /api/broll?category=&tag=
POST   /api/broll              // register new clip
PATCH  /api/broll/:id/use      // increment usedCount + lastUsedAt
```

### Hermes-specific (natural language → action)

```ts
POST   /api/hermes/capture
// Body: { text: string, type?: "idea" | "opinion" | "auto" }
// Auto-classifies via LLM + saves to right table.
// Returns: { saved: boolean, entity: Idea|Opinion, classification: string }

POST   /api/hermes/brief
// Body: { type: "today" | "week" | "filming-day" }
// Returns natural language briefing untuk Ren read aloud / DM.

POST   /api/hermes/status
// Body: { reelId: string, newStatus: string, notes?: string }
// Same as PATCH /api/reels/:id/status but Ren-friendly.
```

### Bulk operations

```ts
POST   /api/seed/pillars       // one-time seed 7 pillars
POST   /api/batch/schedule     // batch-schedule N reels from idea bank
```

---

## 4. Hermes MCP Tool Definitions

Ren akan expose tools ini via MCP. Setiap tool → API call → result.

```typescript
// hermes/tools/r2-studio.ts

export const tools = [
  {
    name: "studio_today_brief",
    description: "Get today's filming + posting tasks dari R2·STUDIO. Pakai saat user tanya 'apa yang harus difilming hari ini' atau 'apa schedule hari ini'.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => fetch(`${BASE}/api/today`, { headers: { 'x-api-key': KEY } })
  },

  {
    name: "studio_week_view",
    description: "Get next 7 days reel schedule. Pakai saat user tanya 'schedule minggu ini' atau planning.",
    inputSchema: { type: "object", properties: { startDate: { type: "string", format: "date" } } },
  },

  {
    name: "studio_capture_idea",
    description: "Capture ide/hook/angle mentah dari user. Pakai saat user bilang 'idein ke STUDIO', 'capture ini', atau brainstorm. Auto-classify pillar.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Ide content mentah" },
        pillar: { type: "string", enum: ["belajar","mindset","build","struggle","hangzhou","mandarin","vision","auto"] },
        notes: { type: "string" }
      },
      required: ["content"]
    }
  },

  {
    name: "studio_capture_opinion",
    description: "Capture contrarian opinion / take untuk Mindset reels bank. Beda dari idea — ini reusable ammunition.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        context: { type: "string", description: "Background / receipts" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["content"]
    }
  },

  {
    name: "studio_create_reel",
    description: "Create new reel di pipeline. Auto-assign next dayNumber. Bisa create dari idea (promote) atau standalone.",
    inputSchema: {
      type: "object",
      properties: {
        pillar: { type: "string" },
        scheduledDate: { type: "string", format: "date" },
        hook: { type: "string" },
        fromIdeaId: { type: "string" }
      },
      required: ["pillar"]
    }
  },

  {
    name: "studio_update_reel_status",
    description: "Update status reel (idea → scripted → filmed → edited → posted). Pakai saat user lapor progress: 'reel hari ini udah selesai filming', 'reel X udah posted'.",
    inputSchema: {
      type: "object",
      properties: {
        reelId: { type: "string" },
        dayNumber: { type: "integer", description: "Alternative ke reelId — search by day" },
        newStatus: { type: "string", enum: ["idea","scripted","filmed","edited","posted","skipped"] },
        notes: { type: "string" },
        igUrl: { type: "string" },
        tiktokUrl: { type: "string" }
      },
      required: ["newStatus"]
    }
  },

  {
    name: "studio_get_ideas",
    description: "Browse ideas bank. Filter by pillar/status. Pakai saat user butuh 'kasih aku 3 ide buat Selasa minggu depan'.",
    inputSchema: {
      type: "object",
      properties: {
        pillar: { type: "string" },
        status: { type: "string", default: "ready" },
        limit: { type: "integer", default: 5 }
      }
    }
  },

  {
    name: "studio_get_opinions",
    description: "Pull fresh opinions dari bank untuk Mindset reels. Filter by tags.",
    inputSchema: {
      type: "object",
      properties: {
        tags: { type: "array", items: { type: "string" } },
        limit: { type: "integer", default: 3 }
      }
    }
  },

  {
    name: "studio_streak",
    description: "Get current posting streak. Motivational signal.",
    inputSchema: { type: "object", properties: {} }
  }
];
```

---

## 5. Sample Conversation Flows (Ren ↔ Richie ↔ R2·STUDIO)

### Flow 1: Pagi briefing
```
Richie: "Ren, brief STUDIO hari ini"
Ren (calls studio_today_brief):
  "Pagi. Hari ini Day 47, pillar Rabu Build Day.
   - Filming: belum ada (1 reel udah scripted)
   - Reel hari ini: 'The Pro inget percakapan 3 minggu lalu — demo 30 detik'
   - Status: scripted, butuh filming + edit
   - Streak: 12 hari berturut-turut. Jangan break."
```

### Flow 2: Capture ide saat lagi cycling
```
Richie (voice): "Ren, capture ide: kenapa solo founder Indonesia harus berani show struggle, bukan cuma success"
Ren (calls studio_capture_idea, auto-classifies → "struggle" pillar):
  "Captured. Pillar: Struggle (Kamis). Status: draft.
   Mau promote ke reel scheduled? Atau biarin di bank dulu?"
Richie: "Bank dulu"
```

### Flow 3: Pull ide pre-batch-filming
```
Richie: "Ren, kasih aku 5 ide ready untuk batch film Minggu"
Ren (calls studio_get_ideas with status=ready, limit=5):
  "5 ide ready (mixed pillar):
   1. [Mindset] 'Volume > one-shot perfection — kenapa gen-Z harus do, bukan think'
   2. [Build] 'Email Manager process 50 email dalam 90 detik — demo'
   3. [Mandarin] 'HSK 4→6 journey week 3: 3 tools yang gak diajarin di kelas'
   4. [Hangzhou] 'Sehari biasa GMBA student di ZJU'
   5. [Struggle] 'Hari Xendit tolak gue lagi — frustrasi gateway approval'

   Schedule batch Minggu? Atau modify dulu?"
```

### Flow 4: Status update post-filming
```
Richie: "Ren, reel day 47 udah selesai filming. Lanjut edit besok."
Ren (calls studio_update_reel_status, dayNumber=47, status="filmed"):
  "Updated. Day 47 filmed at [timestamp]. Next: edit Rabu pagi.
   Reminder: batch-film Sunday 9am masih on schedule (5 reel pending).
   ARIA bakal include ini di morning briefing besok."
```

### Flow 5: Posted → log URL
```
Richie: "Ren, day 46 udah posted. IG: instagram.com/p/abc, TikTok: tiktok.com/@richie/xyz"
Ren (calls studio_update_reel_status with both URLs + status=posted):
  "Logged. Day 46 posted.
   Streak: 13 hari ✓
   IG + TikTok URLs saved.
   (V2 reminder: kalau metrics dashboard udah jadi, ARIA bakal auto-pull views besok.)"
```

---

## 6. Web UI (Minimal — 4 pages)

Pakai shadcn/ui (sama dengan ERP). Light/dark mode toggle. Mobile-friendly (kamu sering akses dari HP).

### Page 1: `/` — Dashboard (default landing)
- **Hero section:** Day X of 365, current streak, posting calendar (mini)
- **Today section:** What's filming today, what's posting today, what just got posted
- **This Week section:** 7-day pipeline view, color-coded by pillar
- **Quick capture:** Floating button → modal to add idea/opinion (also via Ren)

### Page 2: `/reels` — Pipeline
- Kanban-style columns: Idea → Scripted → Filmed → Edited → Posted
- Drag-drop to move between columns (status update)
- Filter by pillar, date range
- Click row → detail drawer with full script + B-roll list + notes

### Page 3: `/ideas` — Bank
- Two tabs: Ideas | Opinions
- List view with pillar tags, status, source
- Search + filter
- One-click "Promote to reel" → opens new reel form pre-filled

### Page 4: `/library` — B-roll references
- Grid view of B-roll clips, grouped by category
- Tag, file path, usage count, last-used date
- Mark "use in reel X" → increments usedCount

---

## 7. Realtime via Supabase Channels

Pakai Supabase Realtime untuk auto-update UI saat Ren modify data (mirip Bug Daemon kamu di ERP).

```typescript
// app/dashboard/realtime.tsx
useEffect(() => {
  const channel = supabase
    .channel('r2-studio')
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'Reel' },
        (payload) => mutate('/api/today'))
    .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Idea' },
        (payload) => toast(`Ren just captured: "${payload.new.content.slice(0,60)}..."`))
    .subscribe();
  return () => channel.unsubscribe();
}, []);
```

Hasil: kamu lagi buka dashboard di laptop, Ren ngebahas ide via Telegram, ide muncul di dashboard real-time. Loop tertutup.

---

## 8. Seed Data (pakai sebelum first ship)

```typescript
// scripts/seed-pillars.ts
const pillars = [
  { name: "Belajar",  dayOfWeek: 1, colorMode: "M1-Workspace-Warm",   description: "Knowledge drop dari hari itu — coding, GMBA class, AI insight." },
  { name: "Mindset",  dayOfWeek: 2, colorMode: "M3-Manifesto-Cinema", description: "Opini contrarian. Authority-building. Daley-style cinematic." },
  { name: "Build",    dayOfWeek: 3, colorMode: "M1-Workspace-Warm",   description: "weuseai.agent progress, demo, screen recording." },
  { name: "Struggle", dayOfWeek: 4, colorMode: "M1-Workspace-Warm",   description: "Vulnerability post. Yang gagal, yang frustasi, real talk." },
  { name: "Hangzhou", dayOfWeek: 5, colorMode: "M2-Outdoor-Cool",     description: "GMBA + China life + cultural observations." },
  { name: "Mandarin", dayOfWeek: 6, colorMode: "M2-Outdoor-Cool",     description: "HSK 4→6 journey. Learning hacks. AI + Mandarin." },
  { name: "Vision",   dayOfWeek: 7, colorMode: "M3-Manifesto-Cinema", description: "Manifesto. Highest production. Generational take." },
];
```

Plus seed opinions bank pakai 4 opini yang udah kamu sebut di conversation:
1. "Building in public has symmetric returns" + context
2. "AI is the new way to build/raise — bukan cuma ChatGPT" + context
3. "Volume > one-shot perfection. Do, don't think." + context
4. "Generasi ini gak boleh cuma jadi penonton — harus participate" + context

---

## 9. Build Plan (3-Day Sprint)

### Day 1 — Backend (6-8 jam)
- Init Next.js 14 app, install deps (Prisma, Supabase, shadcn, zod, tanstack-query)
- Setup Supabase project (or pakai existing), wire DATABASE_URL
- Write `schema.prisma`, run `prisma db push`
- Seed pillars + opinions
- Build all API routes (`/api/reels`, `/api/today`, `/api/ideas`, `/api/opinions`, `/api/hermes/*`)
- API key middleware
- Deploy ke Vercel, test endpoints via curl/Postman

### Day 2 — Hermes Integration (4-6 jam)
- Add R2·STUDIO tools ke Hermes MCP server config
- Test setiap tool dari Ren via Telegram
- Verify activity logging
- Test realtime: insert via curl, lihat update di Supabase dashboard

### Day 3 — Web UI (6-8 jam)
- Setup layout + nav + dark/light toggle
- Build dashboard page (today + week view)
- Build kanban page (drag-drop status update)
- Build ideas page (list + promote)
- Build library page (grid view)
- Realtime channel subscription
- Deploy + Vercel password protect

### Day 4 (buffer) — Polish + dogfood
- Use it for full day, find friction
- Fix obvious bugs
- Add 2-3 ideas/opinions via Ren to verify end-to-end
- Move first 7 reel scripts (from Script Pack v1 — pending) into the system

**Total: 16-22 jam. Bisa dipecah jadi 4 working days kalau di-interleave dengan kerjaan lain.**

---

## 10. Claude Code Build Prompt (ready to paste)

```
Build R2·STUDIO, a content operations system for managing a 365-day reel project. Use the existing R2·OS pattern (Next.js 14 App Router + Supabase + Prisma + Vercel + shadcn/ui + Tailwind), same as the ERP repo.

Scope: V1 minimal viable. Ideas bank + reels pipeline + schedule view + Hermes MCP API. No metrics dashboard, no auth UI, no analytics integration (V2).

Tech stack:
- Next.js 14 App Router (TypeScript)
- Prisma + PostgreSQL via Supabase
- shadcn/ui components
- TanStack Query for data fetching
- Supabase Realtime for live updates
- API key middleware for Hermes integration

Reference the full spec at: /vault/Projects/R2-STUDIO/SPEC.md

Steps:
1. Init project, install all dependencies, configure Tailwind + shadcn
2. Implement schema.prisma per spec section 2
3. Seed pillars and starter opinions per spec section 8
4. Build API routes per spec section 3 with zod validation + API key middleware
5. Build 4 pages (dashboard, reels kanban, ideas, b-roll library) per spec section 6
6. Add Supabase realtime subscriptions per spec section 7
7. Deploy to Vercel, password-protect via Vercel auth
8. Output a curl-based test script to verify all endpoints

Hard constraints:
- Use Indonesian language for all UI strings (aku/kamu register, gen-Z, not formal)
- All status enums match spec exactly (idea | scripted | filmed | edited | posted | skipped)
- Drag-drop on kanban must update DB via PATCH /api/reels/:id/status with optimistic UI
- Realtime updates must work without page refresh
- API key check via x-api-key header, env var R2_STUDIO_API_KEY
- Dark mode default, light mode toggle
- Mobile-responsive (Tailwind breakpoints)

Do NOT build (out of scope for V1):
- Metrics ingestion or dashboard
- IG/TikTok API integration
- Multi-user auth
- AI-generated hooks
- Email notifications

After build, output:
- Deployed Vercel URL
- API key for Hermes (generate random)
- Sample curl commands for each endpoint
- Note any issues encountered

Run `db push` after schema changes. Run `tsc --noEmit` before deploy to verify types.
```

---

## 11. Open Questions Before Build

Sebelum eksekusi, jawab 3 hal:

1. **Pakai Supabase project mana?** Bikin baru atau reuse ERP project? Bikin baru lebih clean tapi nambah cost ($0 free tier sebenernya OK). Recommendation: bikin baru, `r2-studio-prod`, isolasi schema.

2. **Repo strategy.** Monorepo dengan R2·OS lain atau standalone? Recommendation: standalone repo `r2-studio`, deploy independen di Vercel, biar gak ganggu R2·OS deploys.

3. **Hermes deployment.** MCP tools di Mac Mini Hermes server existing, atau spawn dedicated process? Recommendation: tambahin ke existing Hermes MCP config — udah ada infrastructure (LaunchAgent, ports 9222/9223), satu config file change. ARIA juga bisa langsung consume API buat morning briefing.

---

## 12. V2 Roadmap (after 30 reels of real data)

Jangan lupa tapi jangan bangun sekarang:

- **Metrics ingestion** — IG Graph API + TikTok Display API auto-pull views/likes/saves harian
- **Performance leaderboard** — top 10 reels by metric × period
- **Pillar performance** — which pillar drives most follows vs saves vs profile visits
- **Hook pattern detection** — AI analyzes top performers, extracts patterns
- **Auto-generate next-week schedule** — based on what's working
- **Cross-platform compare** — IG vs TikTok performance per reel
- **A/B test variant** — same content, different hook, log which won
- **Calendar export** — iCal feed buat sync ke Apple Calendar

---

## Final note

V1 ini bukan masterpiece — ini tool. Build cepat, dogfood, iterate. Target: ship Day 3, dogfood Day 4-10, eval Day 30. Setelah 30 hari ada data, baru bicara V2.

Resist scope creep. Setiap "kayanya bagus kalau ada feature X" ditulis di backlog, jangan dibangun di V1. Goal V1: jangan kehilangan ide, jangan miss schedule, biar Ren bisa pegang sistemnya tanpa harus ngandelin chat history Claude.
