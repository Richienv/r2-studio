import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

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
  {
    content: "Building in public has symmetric returns — downside kecil (orang respect attempt), upside besar (built-in audience + credibility + customers).",
    context: "Naval-style asymmetric framing applied to creator-founder life.",
    tags: ["building-in-public", "philosophy", "asymmetric"],
  },
  {
    content: "AI bukan ChatGPT. AI adalah agent stack — research agent, content agent, planning agent, food agent. Yang masih pake satu tool masih di era lama.",
    context: "Hermes stack (6 sub-agents), weuseai.agent (9 production agents), ERP bug daemon. 3 tahun ahead dari rata-rata founder Indo.",
    tags: ["ai", "agents", "indonesia"],
  },
  {
    content: "Volume > one-shot perfection. Do, don't think. Cost mencoba 100 hal dan 95 gagal lebih kecil dari cost overthinking 5 hal.",
    context: "Bias to action. Stop planning, start shipping.",
    tags: ["mindset", "execution", "doer"],
  },
  {
    content: "Generasi kita gak boleh cuma jadi penonton — harus participate di digital era + digital money wave. Sisanya 10 tahun. Most akan spectate, sedikit yang build.",
    context: "Generational manifesto. Indonesia specifically lagi ketinggalan wave AI.",
    tags: ["generational", "manifesto", "indonesia", "ai"],
  },
];

async function main() {
  for (const p of pillars) {
    await db.pillar.upsert({
      where: { dayOfWeek: p.dayOfWeek },
      update: {},
      create: p,
    });
  }
  console.log(`✓ seeded ${pillars.length} pillars`);

  for (const o of opinions) {
    const existing = await db.opinion.findFirst({
      where: { content: o.content },
    });
    if (existing) continue;
    await db.opinion.create({
      data: {
        content: o.content,
        context: o.context,
        tags: o.tags,
      },
    });
  }
  console.log(`✓ seeded opinions (idempotent)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
