"use client";

import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowRight, Archive, Tag } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Idea, Opinion, Pillar } from "@/lib/types";
import { Button, PillarTag, Select, Textarea, Label } from "@/components/ui";
import { QuickCapture } from "@/components/quick-capture";

type Tab = "ideas" | "opinions";

export default function IdeasPage() {
  const [tab, setTab] = useState<Tab>("ideas");
  return (
    <main className="min-h-[100dvh] pb-24 md:pb-6">
      <header className="px-5 pt-5 pb-3 hairline-b">
        <div className="font-display text-3xl tracking-wide">DAFTAR</div>
        <div className="flex mt-3 gap-1">
          <button
            onClick={() => setTab("ideas")}
            className={`flex-1 py-2 mono-caps hairline ${
              tab === "ideas" ? "bg-accent text-bg" : "bg-surface text-textDim"
            }`}
          >
            IDE
          </button>
          <button
            onClick={() => setTab("opinions")}
            className={`flex-1 py-2 mono-caps hairline ${
              tab === "opinions"
                ? "bg-accent text-bg"
                : "bg-surface text-textDim"
            }`}
          >
            OPINI
          </button>
        </div>
      </header>

      {tab === "ideas" ? <IdeaList /> : <OpinionList />}
      <QuickCapture />
    </main>
  );
}

function IdeaList() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const ideasQ = useQuery({
    queryKey: ["ideas", status],
    queryFn: () =>
      api.get<{ ideas: Idea[] }>(
        `/api/ideas${status ? `?status=${status}` : ""}`
      ),
  });
  const pillarsQ = useQuery({
    queryKey: ["pillars"],
    queryFn: () => api.get<{ pillars: Pillar[] }>("/api/pillars"),
    staleTime: Infinity,
    refetchInterval: false,
  });

  const promote = useMutation({
    mutationFn: (id: string) => api.post(`/api/ideas/${id}/promote`, {}),
    onSuccess: () => qc.invalidateQueries(),
  });
  const archive = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/ideas/${id}`, { status: "archived" }),
    onSuccess: () => qc.invalidateQueries(),
  });

  const ideas = ideasQ.data?.ideas ?? [];

  return (
    <>
      <NewIdeaForm pillars={pillarsQ.data?.pillars ?? []} />

      <div className="px-5 py-2 hairline-b flex gap-1 overflow-x-auto">
        {["", "draft", "ready", "promoted", "archived"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 hairline mono-caps whitespace-nowrap ${
              status === s ? "bg-accent text-bg" : "bg-surface text-textDim"
            }`}
          >
            {s || "all"}
          </button>
        ))}
      </div>

      <ul>
        {ideasQ.isLoading && (
          <li className="px-5 py-8 mono-caps text-textDim">loading...</li>
        )}
        {!ideasQ.isLoading && ideas.length === 0 && (
          <li className="px-5 py-12 mono-caps text-textDim text-center">
            Belum ada ide. Tap + buat capture.
          </li>
        )}
        {ideas.map((idea) => (
          <li key={idea.id} className="hairline-b px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <PillarTag name={idea.pillar?.name} />
              <span className="mono-caps text-textDim">
                {idea.source} · {timeAgo(idea.createdAt)}
              </span>
            </div>
            <div className="text-text">{idea.content}</div>
            {idea.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {idea.tags.map((t) => (
                  <span
                    key={t}
                    className="mono-caps text-textDim flex items-center gap-1"
                  >
                    <Tag size={9} strokeWidth={1.5} />
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              {idea.status !== "promoted" && (
                <Button
                  variant="primary"
                  onClick={() => promote.mutate(idea.id)}
                  disabled={!idea.pillarId || promote.isPending}
                  className="flex items-center gap-1 px-3"
                >
                  <ArrowRight size={12} /> REEL
                </Button>
              )}
              {idea.status !== "archived" && (
                <Button
                  variant="default"
                  onClick={() => archive.mutate(idea.id)}
                  disabled={archive.isPending}
                  className="flex items-center gap-1 px-3"
                >
                  <Archive size={12} /> ARSIP
                </Button>
              )}
              {idea.status === "promoted" && (
                <span className="mono-caps text-success self-center">
                  ✓ promoted
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function NewIdeaForm({ pillars }: { pillars: Pillar[] }) {
  const [content, setContent] = useState("");
  const [pillarId, setPillarId] = useState("");
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: () =>
      api.post("/api/ideas", {
        content,
        pillarId: pillarId || null,
        source: "web",
      }),
    onSuccess: () => {
      qc.invalidateQueries();
      setContent("");
      setPillarId("");
    },
  });
  return (
    <div className="px-5 py-4 hairline-b space-y-2">
      <Label>IDE BARU</Label>
      <Textarea
        rows={2}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Hook, insight, angle..."
      />
      <div className="flex gap-2">
        <Select
          value={pillarId}
          onChange={(e) => setPillarId(e.target.value)}
          className="flex-1"
        >
          <option value="">— pillar —</option>
          {pillars.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Button
          variant="primary"
          onClick={() => create.mutate()}
          disabled={!content.trim() || create.isPending}
          className="px-5"
        >
          + IDE
        </Button>
      </div>
    </div>
  );
}

function OpinionList() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const [content, setContent] = useState("");
  const opinionsQ = useQuery({
    queryKey: ["opinions", status],
    queryFn: () =>
      api.get<{ opinions: Opinion[] }>(
        `/api/opinions${status ? `?status=${status}` : ""}`
      ),
  });
  const create = useMutation({
    mutationFn: () => api.post("/api/opinions", { content }),
    onSuccess: () => {
      qc.invalidateQueries();
      setContent("");
    },
  });
  const archive = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/opinions/${id}`, { status: "archived" }),
    onSuccess: () => qc.invalidateQueries(),
  });

  const opinions = opinionsQ.data?.opinions ?? [];

  return (
    <>
      <div className="px-5 py-4 hairline-b space-y-2">
        <Label>OPINI BARU</Label>
        <Textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Take panas, contrarian, manifesto..."
        />
        <Button
          variant="primary"
          onClick={() => create.mutate()}
          disabled={!content.trim() || create.isPending}
          className="w-full"
        >
          + OPINI
        </Button>
      </div>

      <div className="px-5 py-2 hairline-b flex gap-1 overflow-x-auto">
        {["", "fresh", "used", "archived"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 hairline mono-caps whitespace-nowrap ${
              status === s ? "bg-accent text-bg" : "bg-surface text-textDim"
            }`}
          >
            {s || "all"}
          </button>
        ))}
      </div>

      <ul>
        {opinionsQ.isLoading && (
          <li className="px-5 py-8 mono-caps text-textDim">loading...</li>
        )}
        {opinions.map((o) => (
          <li key={o.id} className="hairline-b px-5 py-4 space-y-2">
            <div className="text-text">{o.content}</div>
            {o.context && (
              <div className="mono-caps text-textDim text-[10px]">
                CONTEXT: {o.context}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="mono-caps text-textDim">
                {o.status} · {timeAgo(o.createdAt)}
              </span>
              {o.status !== "archived" && (
                <Button
                  variant="ghost"
                  onClick={() => archive.mutate(o.id)}
                  className="px-2"
                >
                  ARSIP
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
