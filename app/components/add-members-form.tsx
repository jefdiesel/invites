"use client";

import { useState, useRef } from "react";

type ParsedMember = { name: string; email: string };

function parseCsv(text: string): ParsedMember[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const first = lines[0].toLowerCase();
  const hasHeader = first.includes("name") || first.includes("email");
  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines.map((line) => {
    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length >= 2) {
      const a = parts[0], b = parts[1];
      if (a.includes("@")) return { name: b, email: a };
      return { name: a, email: b };
    }
    return { name: parts[0] || "", email: "" };
  }).filter((m) => m.name && m.email && m.email.includes("@"));
}

export function AddMembersForm({
  pollId, action, memberCount,
}: {
  pollId: string; action: (pollId: string, members: ParsedMember[]) => Promise<void>; memberCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ParsedMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleTextChange(text: string) { setCsv(text); setPreview(parseCsv(text)); }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const text = ev.target?.result as string; setCsv(text); setPreview(parseCsv(text)); };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (preview.length === 0) return;
    setSubmitting(true); await action(pollId, preview); setCsv(""); setPreview([]); setOpen(false); setSubmitting(false);
  }

  if (!open) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-warm-400 tabular-nums">{memberCount} members</span>
        <button onClick={() => setOpen(true)} className="text-sm text-accent hover:text-accent-light transition-colors">+ Add</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 px-3 py-2 text-sm font-medium text-warm-600 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-700 transition-colors">
          Upload CSV
        </button>
        <span className="text-sm text-warm-400">or paste below</span>
      </div>
      <textarea value={csv} onChange={(e) => handleTextChange(e.target.value)} rows={3}
        placeholder={"Name, Email\nAlice, alice@club.com\nBob, bob@club.com"}
        className="w-full rounded-lg border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 px-3 py-2.5 text-sm font-mono text-warm-900 dark:text-warm-100 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
      {preview.length > 0 && (
        <div className="rounded-lg border border-warm-200 dark:border-warm-800 overflow-hidden">
          <div className="px-3 py-2 bg-warm-50 dark:bg-warm-800/50 text-sm text-warm-500 font-medium">
            {preview.length} member{preview.length === 1 ? "" : "s"} found
          </div>
          <div className="max-h-32 overflow-y-auto divide-y divide-warm-100 dark:divide-warm-800/50">
            {preview.slice(0, 20).map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-1.5 text-sm">
                <span className="text-warm-700 dark:text-warm-300 w-32 truncate">{m.name}</span>
                <span className="text-warm-400 truncate">{m.email}</span>
              </div>
            ))}
            {preview.length > 20 && <div className="px-3 py-1.5 text-xs text-warm-400">+{preview.length - 20} more</div>}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={submitting || preview.length === 0}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-light disabled:opacity-40 transition-colors">
          {submitting ? "Adding..." : `Add ${preview.length} Member${preview.length === 1 ? "" : "s"}`}
        </button>
        <button type="button" onClick={() => { setOpen(false); setCsv(""); setPreview([]); }} className="text-sm text-warm-400 hover:text-warm-600 transition-colors">Cancel</button>
      </div>
    </form>
  );
}
