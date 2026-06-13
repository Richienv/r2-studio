"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Reel, ReelStatus, Pillar } from "@/lib/types";
import { PillarTag, StatusPill, Select } from "@/components/ui";
import { ReelDrawer } from "@/components/reel-drawer";
import { QuickCapture } from "@/components/quick-capture";

const STATUSES: (ReelStatus | "all")[] = [
  "all",
  "idea",
  "scripted",
  "filmed",
  "edited",
  "posted",
];

const NEXT_STATUS: Record<ReelStatus, ReelStatus> = {
  idea: "scripted",
  scripted: "filmed",
  filmed: "edited",
  edited: "posted",
  posted: "idea",
};

export default function PipelinePage() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [pillarId, setPillarId] = useState<string>("");
  const [openReel, setOpenReel] = useState<Reel | null>(null);
  const qc = useQueryClient();

  const reelsQ = useQuery({
    queryKey: ["reels", status, pillarId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (pillarId) params.set("pillar", pillarId);
      params.set("limit", "365");
      return api.get<{ reels: Reel[] }>(`/api/reels?${params}`);
    },
  });

  const pillarsQ = useQuery({
    queryKey: ["pillars"],
    queryFn: () => api.get<{ pillars: Pillar[] }>("/api/pillars"),
    staleTime: Infinity,
    refetchInterval: false,
  });

  const cycleStatus = useMutation({
    mutationFn: async (reel: Reel) =>
      api.patch(`/api/reels/${reel.id}/status`, {
        newStatus: NEXT_STATUS[reel.status],
      }),
    onSuccess: () => qc.invalidateQueries(),
  });

  const reels = reelsQ.data?.reels ?? [];

  return (
    <main className="min-h-[100dvh] pb-24 md:pb-6">
      <header className="px-5 pt-5 pb-3 hairline-b">
        <div className="font-display text-3xl tracking-wide">PIPELINE</div>
        <div className="mono-caps text-textDim mt-1">
          {reels.length} reel · tap status to cycle
        </div>
      </header>

      <div className="px-5 py-3 space-y-3 hairline-b">
        <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 hairline mono-caps whitespace-nowrap ${
                status === s
                  ? "bg-accent text-bg"
                  : "bg-surface text-textDim"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Select
          value={pillarId}
          onChange={(e) => setPillarId(e.target.value)}
        >
          <option value="">ALL PILLARS</option>
          {pillarsQ.data?.pillars.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      <ul>
        {reelsQ.isLoading && (
          <li className="px-5 py-8 mono-caps text-textDim">loading...</li>
        )}
        {!reelsQ.isLoading && reels.length === 0 && (
          <li className="px-5 py-12 mono-caps text-textDim text-center">
            Belum ada reel cocok filter ini.
          </li>
        )}
        {reels.map((r) => (
          <li
            key={r.id}
            className="hairline-b px-5 py-4 flex items-start gap-4 active:bg-surface"
            onClick={() => setOpenReel(r)}
          >
            <div className="font-display text-3xl text-text shrink-0 w-12 text-center leading-none">
              {r.dayNumber}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <PillarTag name={r.pillar?.name} />
                <span className="mono-caps text-textDim">
                  {new Date(r.scheduledDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="text-sm text-text line-clamp-2">
                {r.hook ?? (
                  <span className="text-textDim italic">no hook yet</span>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                cycleStatus.mutate(r);
              }}
              className="shrink-0"
            >
              <StatusPill status={r.status} />
            </button>
          </li>
        ))}
      </ul>

      <ReelDrawer reel={openReel} onClose={() => setOpenReel(null)} />
      <QuickCapture />
    </main>
  );
}
