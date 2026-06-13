"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button, Textarea, Select, Label } from "./ui";
import type { Pillar } from "@/lib/types";

type Kind = "idea" | "opinion";

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("idea");
  const [text, setText] = useState("");
  const [pillarId, setPillarId] = useState<string>("");
  const qc = useQueryClient();

  const { data: pillarsData } = useQuery({
    queryKey: ["pillars"],
    queryFn: () => api.get<{ pillars: Pillar[] }>("/api/pillars"),
    refetchInterval: false,
    staleTime: Infinity,
  });
  const pillars = pillarsData?.pillars ?? [];

  const mutation = useMutation({
    mutationFn: async () => {
      if (kind === "idea") {
        return api.post("/api/ideas", {
          content: text,
          pillarId: pillarId || null,
          source: "web",
        });
      }
      return api.post("/api/opinions", {
        content: text,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries();
      setText("");
      setPillarId("");
      setOpen(false);
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 bg-accent text-bg flex items-center justify-center hairline shadow-lg active:scale-95 transition-transform"
        aria-label="Quick capture"
      >
        <Plus size={28} strokeWidth={2} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full md:max-w-md bg-bg hairline-t md:hairline p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="font-display text-2xl tracking-wide">CAPTURE</div>
              <button onClick={() => setOpen(false)} className="text-textDim">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={kind === "idea" ? "primary" : "default"}
                onClick={() => setKind("idea")}
                className="flex-1"
              >
                IDE
              </Button>
              <Button
                variant={kind === "opinion" ? "primary" : "default"}
                onClick={() => setKind("opinion")}
                className="flex-1"
              >
                OPINI
              </Button>
            </div>

            <div className="space-y-2">
              <Label>{kind === "idea" ? "IDE" : "OPINI"}</Label>
              <Textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  kind === "idea"
                    ? "Hook, angle, atau insight cepet..."
                    : "Contrarian take, opini panas..."
                }
                autoFocus
              />
            </div>

            {kind === "idea" && (
              <div className="space-y-2">
                <Label>PILLAR (opsional)</Label>
                <Select
                  value={pillarId}
                  onChange={(e) => setPillarId(e.target.value)}
                >
                  <option value="">— pilih nanti —</option>
                  {pillars.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                BATAL
              </Button>
              <Button
                variant="primary"
                onClick={() => mutation.mutate()}
                disabled={!text.trim() || mutation.isPending}
                className="flex-1"
              >
                {mutation.isPending ? "..." : "SIMPAN"}
              </Button>
            </div>
            {mutation.error && (
              <div className="text-danger text-xs">
                {(mutation.error as Error).message}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
