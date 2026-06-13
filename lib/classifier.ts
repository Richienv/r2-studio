// Lightweight keyword classifier for Hermes capture endpoint.
// Returns { kind, pillarName } — pillarName is uppercase to match seed.

export type Kind = "opinion" | "idea";

const OPINION_TRIGGERS = [
  "kenapa",
  "menurut gue",
  "menurut saya",
  "menurut aku",
  "harus",
  "salah ngerti",
  "salah paham",
  "contrarian",
  "opini",
  "real talk",
  "the truth is",
  "bukan",
];

export const PILLAR_KEYWORDS: Array<{ pillar: string; words: string[] }> = [
  { pillar: "BUILD", words: ["demo", "feature", "agent", "ship", "build", "deploy", "shipped"] },
  { pillar: "BELAJAR", words: ["belajar", "insight", "kelas", "today i learned", "til", "gmba"] },
  { pillar: "STRUGGLE", words: ["frustasi", "frustrated", "gagal", "bug", "stuck", "burnt out", "tired"] },
  { pillar: "HANGZHOU", words: ["hangzhou", "china", "campus", "zju", "杭州"] },
  { pillar: "MANDARIN", words: ["hsk", "mandarin", "chinese", "中文", "汉语"] },
  { pillar: "VISION", words: ["vision", "generation", "future", "manifesto", "generational"] },
  { pillar: "MINDSET", words: ["mindset", "opini", "menurut", "philosophy"] },
];

export function classifyText(text: string): { kind: Kind; pillarName: string | null } {
  const lower = text.toLowerCase();

  const isOpinion = OPINION_TRIGGERS.some((t) => lower.includes(t));

  let pillarName: string | null = null;
  let bestScore = 0;
  for (const { pillar, words } of PILLAR_KEYWORDS) {
    const score = words.filter((w) => lower.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      pillarName = pillar;
    }
  }

  return {
    kind: isOpinion ? "opinion" : "idea",
    pillarName,
  };
}
