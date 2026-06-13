"use client";

import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Film, X } from "lucide-react";
import { api } from "@/lib/api-client";
import type { BrollClip } from "@/lib/types";
import { Button, Input, Label, Select } from "@/components/ui";
import { QuickCapture } from "@/components/quick-capture";

const CATEGORIES = [
  "WORKSPACE",
  "OUTDOOR-HANGZHOU",
  "MAC-SCREEN",
  "MANDARIN",
  "LIFESTYLE",
  "POV-WALKING",
  "CAMPUS-ZJU",
];

export default function LibraryPage() {
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>("");
  const [openClip, setOpenClip] = useState<BrollClip | null>(null);

  const clipsQ = useQuery({
    queryKey: ["broll", category],
    queryFn: () =>
      api.get<{ clips: BrollClip[] }>(
        `/api/broll${category ? `?category=${category}` : ""}`
      ),
  });

  const markUsed = useMutation({
    mutationFn: (id: string) => api.patch(`/api/broll/${id}/use`, {}),
    onSuccess: () => qc.invalidateQueries(),
  });

  const clips = clipsQ.data?.clips ?? [];

  return (
    <main className="min-h-[100dvh] pb-24 md:pb-6">
      <header className="px-5 pt-5 pb-3 hairline-b">
        <div className="font-display text-3xl tracking-wide">LIBRARY</div>
        <div className="mono-caps text-textDim mt-1">
          {clips.length} b-roll clip
        </div>
      </header>

      <NewClipForm />

      <div className="px-5 py-3 hairline-b flex gap-1 overflow-x-auto">
        <button
          onClick={() => setCategory("")}
          className={`px-3 py-1.5 hairline mono-caps whitespace-nowrap ${
            category === "" ? "bg-accent text-bg" : "bg-surface text-textDim"
          }`}
        >
          ALL
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 hairline mono-caps whitespace-nowrap ${
              category === c ? "bg-accent text-bg" : "bg-surface text-textDim"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3">
        {clipsQ.isLoading && (
          <div className="col-span-full mono-caps text-textDim p-8 text-center">
            loading...
          </div>
        )}
        {!clipsQ.isLoading && clips.length === 0 && (
          <div className="col-span-full mono-caps text-textDim p-8 text-center">
            Belum ada clip. Tambah pakai form di atas.
          </div>
        )}
        {clips.map((clip) => (
          <button
            key={clip.id}
            onClick={() => setOpenClip(clip)}
            className="hairline bg-surface aspect-square p-3 flex flex-col justify-between text-left active:bg-bg"
          >
            <div className="flex items-start justify-between">
              <Film
                size={14}
                strokeWidth={1.5}
                className="text-textDim shrink-0"
              />
              <UsedBadge count={clip.usedCount} />
            </div>
            <div className="mono-caps text-text truncate">{clip.tag}</div>
            <div className="mono-caps text-textDim text-[9px]">
              {clip.duration}s · {clip.category}
            </div>
          </button>
        ))}
      </div>

      {openClip && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center"
          onClick={() => setOpenClip(null)}
        >
          <div
            className="w-full md:max-w-md bg-bg hairline-t md:hairline p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="font-display text-2xl">{openClip.tag}</div>
              <button onClick={() => setOpenClip(null)} className="text-textDim">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-1 mono-caps text-textDim">
              <div>CATEGORY · {openClip.category}</div>
              <div>DURATION · {openClip.duration}s</div>
              <div>USED · {openClip.usedCount}x</div>
              {openClip.lastUsedAt && (
                <div>
                  LAST · {new Date(openClip.lastUsedAt).toLocaleDateString()}
                </div>
              )}
            </div>
            {openClip.description && (
              <div className="text-text text-sm">{openClip.description}</div>
            )}
            <div className="hairline p-2 text-xs text-textDim font-mono break-all">
              {openClip.filePath}
            </div>
            <Button
              variant="primary"
              onClick={() => {
                markUsed.mutate(openClip.id);
                setOpenClip(null);
              }}
              className="w-full"
            >
              + MARK USED
            </Button>
          </div>
        </div>
      )}

      <QuickCapture />
    </main>
  );
}

function UsedBadge({ count }: { count: number }) {
  const cls =
    count === 0
      ? "text-textDim"
      : count > 3
        ? "text-danger"
        : "text-success";
  return <span className={`mono-caps ${cls}`}>{count}x</span>;
}

function NewClipForm() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState("");
  const [filePath, setFilePath] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("WORKSPACE");
  const [description, setDescription] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.post("/api/broll", {
        tag,
        filePath,
        duration: Number(duration),
        category,
        description: description || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries();
      setTag("");
      setFilePath("");
      setDuration("");
      setDescription("");
      setOpen(false);
    },
  });

  if (!open) {
    return (
      <div className="px-5 py-3 hairline-b">
        <Button
          variant="default"
          onClick={() => setOpen(true)}
          className="w-full"
        >
          + TAMBAH CLIP
        </Button>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 hairline-b space-y-3">
      <div className="flex items-center justify-between">
        <Label>TAMBAH CLIP</Label>
        <button onClick={() => setOpen(false)} className="text-textDim">
          <X size={16} />
        </button>
      </div>
      <Input
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        placeholder="tag (mis: workspace-monitors-01)"
      />
      <Input
        value={filePath}
        onChange={(e) => setFilePath(e.target.value)}
        placeholder="filePath (mis: /Footage/2026/05/IMG_0123.mov)"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="duration (s)"
          type="number"
        />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="description (opsional)"
      />
      <Button
        variant="primary"
        onClick={() => create.mutate()}
        disabled={!tag || !filePath || !duration || create.isPending}
        className="w-full"
      >
        {create.isPending ? "..." : "SIMPAN CLIP"}
      </Button>
    </div>
  );
}
