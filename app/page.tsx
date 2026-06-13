"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Settings, Flame } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Summary, TodayPayload, WeekPayload } from "@/lib/types";
import { PillarTag, StatusPill, StatusDot } from "@/components/ui";
import { QuickCapture } from "@/components/quick-capture";

export default function TodayPage() {
  const summary = useQuery({
    queryKey: ["summary"],
    queryFn: () => api.get<Summary>("/api/summary"),
  });

  const today = useQuery({
    queryKey: ["today"],
    queryFn: () => api.get<TodayPayload>("/api/today"),
  });

  const week = useQuery({
    queryKey: ["week"],
    queryFn: () => api.get<WeekPayload>("/api/week"),
  });

  const day = today.data?.day ?? 0;
  const streak = today.data?.streak ?? 0;
  const todaysReel = today.data?.filming[0] ?? today.data?.posting[0] ?? null;

  return (
    <main className="min-h-[100dvh] pb-24 md:pb-6 flex flex-col">
      <header className="px-5 pt-5 pb-3 flex items-center justify-between md:hidden">
        <div className="font-display text-xl tracking-wide">R2·STUDIO</div>
        <button className="text-textDim">
          <Settings size={18} strokeWidth={1.5} />
        </button>
      </header>

      <section className="px-5 py-4 flex flex-col items-start">
        <div className="flex items-baseline">
          <div
            className="font-display text-accent"
            style={{ fontSize: "clamp(80px, 22vw, 140px)", lineHeight: 0.85 }}
          >
            {day}
          </div>
          <div
            className="font-display text-textDim ml-2"
            style={{ fontSize: "clamp(28px, 7vw, 44px)" }}
          >
            /365
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Flame size={14} className="text-success" strokeWidth={1.5} />
          <span className="mono-caps text-success">{streak} day streak</span>
        </div>
      </section>

      <section className="px-5 py-3">
        <div className="mono-caps text-textDim mb-2">HARI INI</div>
        {today.isLoading ? (
          <div className="hairline p-4 mono-caps text-textDim">loading...</div>
        ) : todaysReel ? (
          <Link
            href={`/pipeline?reel=${todaysReel.id}`}
            className="block hairline bg-surface p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <PillarTag name={todaysReel.pillar?.name} />
              <StatusPill status={todaysReel.status} />
            </div>
            <div className="font-sans text-text">
              {todaysReel.hook ?? (
                <span className="text-textDim italic">
                  Belum ada hook — tap to script.
                </span>
              )}
            </div>
            <div className="mono-caps text-textDim">
              DAY {todaysReel.dayNumber} ·{" "}
              {new Date(todaysReel.scheduledDate).toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </div>
          </Link>
        ) : (
          <div className="hairline bg-surface p-4 mono-caps text-textDim">
            Belum ada reel dijadwalin hari ini.
          </div>
        )}
      </section>

      <section className="px-5 py-3">
        <div className="mono-caps text-textDim mb-2">MINGGU INI</div>
        <div className="grid grid-cols-7 gap-1">
          {(week.data?.days ?? Array.from({ length: 7 })).map((bucket, i) => {
            const d = bucket as WeekPayload["days"][number] | undefined;
            const reel = d?.reels[0];
            const date = d ? new Date(d.date) : null;
            const now = new Date();
            const isToday =
              !!date &&
              date.getDate() === now.getDate() &&
              date.getMonth() === now.getMonth();
            return (
              <Link
                key={i}
                href="/pipeline"
                className="hairline aspect-[3/4] p-1.5 flex flex-col justify-between bg-surface"
                style={isToday ? { borderColor: "#e8ff47" } : undefined}
              >
                <div className="mono-caps text-textDim text-[9px]">
                  {date
                    ? date
                        .toLocaleDateString("id-ID", { weekday: "short" })
                        .slice(0, 3)
                    : "—"}
                </div>
                {reel ? (
                  <>
                    <div className="font-display text-base leading-none text-text">
                      {reel.dayNumber}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[10px] tracking-wide text-accent truncate">
                        {reel.pillar?.name?.slice(0, 4) ?? "—"}
                      </span>
                      <StatusDot status={reel.status} />
                    </div>
                  </>
                ) : (
                  <div className="text-textDim text-[10px]">—</div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {summary.data?.highlight && (
        <section className="px-5 py-3 mt-auto">
          <div className="hairline-t pt-3 mono-caps text-accent">
            {summary.data.highlight}
          </div>
        </section>
      )}

      <QuickCapture />
    </main>
  );
}
