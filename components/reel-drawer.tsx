"use client";

import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button, Input, Label, Textarea } from "./ui";
import { PillarTag, StatusDot } from "./ui";
import type { Reel } from "@/lib/types";

const STATUSES = ["idea", "scripted", "filmed", "edited", "posted"] as const;

export function ReelDrawer({
  reel,
  onClose,
}: {
  reel: Reel | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Reel | null>(reel);
  const qc = useQueryClient();

  useEffect(() => setDraft(reel), [reel]);

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) return;
      return api.patch(`/api/reels/${draft.id}`, {
        hook: draft.hook,
        act1Broll: draft.act1Broll,
        act2Script: draft.act2Script,
        act3Payoff: draft.act3Payoff,
        cta: draft.cta,
        musicVibe: draft.musicVibe,
        notes: draft.notes,
        igUrl: draft.igUrl,
        tiktokUrl: draft.tiktokUrl,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries();
      onClose();
    },
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!draft) return;
      return api.del(`/api/reels/${draft.id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries();
      onClose();
    },
  });

  if (!draft) return null;

  const statusIdx = STATUSES.indexOf(draft.status);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-lg max-h-[92dvh] overflow-y-auto bg-bg hairline-t md:hairline"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-bg hairline-b px-5 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="font-display text-2xl">DAY {draft.dayNumber}</div>
            <PillarTag name={draft.pillar?.name} />
          </div>
          <button onClick={onClose} className="text-textDim">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-2">
            {STATUSES.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5 flex-1">
                <StatusDot status={i <= statusIdx ? draft.status : "idea"} />
                <span
                  className={`mono-caps text-[9px] ${
                    i <= statusIdx ? "text-text" : "text-textDim"
                  }`}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>

          <div>
            <Label className="mb-1">HOOK</Label>
            <Textarea
              rows={2}
              value={draft.hook ?? ""}
              onChange={(e) => setDraft({ ...draft, hook: e.target.value })}
              placeholder="3-5 detik pertama. Buat orang gak skip."
            />
          </div>

          <div>
            <Label className="mb-1">ACT 1 — B-ROLL</Label>
            <Textarea
              rows={2}
              value={draft.act1Broll ?? ""}
              onChange={(e) => setDraft({ ...draft, act1Broll: e.target.value })}
              placeholder="Shot list 5-10 detik visual..."
            />
          </div>

          <div>
            <Label className="mb-1">ACT 2 — SCRIPT</Label>
            <Textarea
              rows={5}
              value={draft.act2Script ?? ""}
              onChange={(e) => setDraft({ ...draft, act2Script: e.target.value })}
              placeholder="Main message, narasi..."
            />
          </div>

          <div>
            <Label className="mb-1">ACT 3 — PAYOFF</Label>
            <Textarea
              rows={2}
              value={draft.act3Payoff ?? ""}
              onChange={(e) => setDraft({ ...draft, act3Payoff: e.target.value })}
              placeholder="Punchline / insight / call to think..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1">CTA</Label>
              <Input
                value={draft.cta ?? ""}
                onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1">MUSIC VIBE</Label>
              <Input
                value={draft.musicVibe ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, musicVibe: e.target.value })
                }
                placeholder="lofi, cinematic..."
              />
            </div>
          </div>

          {draft.status === "posted" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1">IG URL</Label>
                <Input
                  value={draft.igUrl ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, igUrl: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="mb-1">TIKTOK URL</Label>
                <Input
                  value={draft.tiktokUrl ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, tiktokUrl: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div>
            <Label className="mb-1">NOTES</Label>
            <Textarea
              rows={3}
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-bg hairline-t px-5 py-3 flex gap-2">
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Hapus reel ini? Gak bisa di-undo.")) del.mutate();
            }}
            className="px-3"
          >
            <Trash2 size={14} />
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">
            BATAL
          </Button>
          <Button
            variant="primary"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex-1"
          >
            {save.isPending ? "..." : "SIMPAN"}
          </Button>
        </div>
      </div>
    </div>
  );
}
