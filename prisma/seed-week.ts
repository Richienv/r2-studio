// Seed the first 7 reel slots, one per pillar, starting from the upcoming
// matching day-of-week. Idempotent: skips days that already have a reel.
//
// Run: npx tsx prisma/seed-week.ts
//
// Pillar.dayOfWeek convention from prisma/seed.ts:
//   1=BELAJAR(Mon)  2=MINDSET(Tue)  3=BUILD(Wed)  4=STRUGGLE(Thu)
//   5=HANGZHOU(Fri) 6=MANDARIN(Sat) 7=VISION(Sun)
// JS Date.getDay(): 0=Sun, 1=Mon, ..., 6=Sat
// → jsDay 0 maps to dayOfWeek 7, otherwise jsDay === dayOfWeek.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const HOOKS: Record<string, string> = {
  BELAJAR: "Hari ini gue belajar [X] — dan ternyata 90% orang salah ngerti soal ini.",
  MINDSET: "Building in public itu compounding interest — invisible di hari 10, gila di hari 100.",
  BUILD: "Day [N] ngeship [feature] — ini demo nya, 30 detik.",
  STRUGGLE: "Real talk: kemarin gue stuck 6 jam di bug yang ternyata 1 baris.",
  HANGZHOU: "Hangzhou bukan kota tier-1, tapi lebih maju dari Jakarta dalam hal [X].",
  MANDARIN: "HSK 4 ke HSK 6 dengan AI: framework yang gue pakai tiap hari.",
  VISION: "Generasi kita punya 10 tahun untuk catch up wave AI. Sisanya cuma jadi penonton.",
};

function jsDayToPillarDayOfWeek(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

async function main() {
  const pillars = await db.pillar.findMany();
  if (pillars.length !== 7) {
    throw new Error(`expected 7 pillars, got ${pillars.length}. Run \`npm run db:seed\` first.`);
  }
  const pillarByDow = new Map(pillars.map((p) => [p.dayOfWeek, p]));

  const today = startOfDay(new Date());
  const lastReel = await db.reel.findFirst({
    orderBy: { dayNumber: "desc" },
    select: { dayNumber: true },
  });
  let dayNumber = (lastReel?.dayNumber ?? 0) + 1;

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const existing = await db.reel.findFirst({
      where: {
        scheduledDate: { gte: startOfDay(date), lte: endOfDay(date) },
      },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const pillar = pillarByDow.get(jsDayToPillarDayOfWeek(date.getDay()));
    if (!pillar) continue;

    await db.reel.create({
      data: {
        dayNumber,
        scheduledDate: date,
        pillarId: pillar.id,
        hook: HOOKS[pillar.name] ?? null,
        status: "idea",
        brollList: [],
        cta: "Link di bio · 1.000 seat launch",
      },
    });

    console.log(
      `+ day ${dayNumber}: ${pillar.name} · ${date.toDateString()}`
    );
    dayNumber += 1;
    created += 1;
  }

  console.log(`\n✓ week-1 seed done. created ${created}, skipped ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
