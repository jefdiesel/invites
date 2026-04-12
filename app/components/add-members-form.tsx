"use client";

import { useState, useRef } from "react";

type ParsedMember = { name: string; email: string };

function parseCsv(text: string): ParsedMember[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  // Detect if first row is a header
  const first = lines[0].toLowerCase();
  const hasHeader = first.includes("name") || first.includes("email");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    // Try to detect which column is name vs email
    if (parts.length >= 2) {
      const a = parts[0], b = parts[1];
      if (a.includes("@")) return { name: b, email: a };
      return { name: a, email: b };
    }
    return { name: parts[0] || "", email: "" };
  }).filter((m) => m.name && m.email && m.email.includes("@"));
}

export function AddMembersForm({
  pollId,
  action,
  memberCount,
}: {
  pollId: string;
  action: (pollId: string, members: ParsedMember[]) => Promise<void>;
  memberCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ParsedMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleTextChange(text: string) {
    setCsv(text);
    setPreview(parseCsv(text));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsv(text);
      setPreview(parseCsv(text));
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (preview.length === 0) return;
    setSubmitting(true);
    await action(pollId, preview);
    setCsv("");
    setPreview([]);
    setOpen(false);
    setSubmitting(false);
  }

  if (!open) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-stone-400 tabular-nums">{memberCount} members</span>
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
        >
          + Add
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      {/* File upload */}
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
        >
          Upload CSV
        </button>
        <span className="text-[11px] text-stone-400">or paste below</span>
      </div>

      {/* Paste area */}
      <textarea
        value={csv}
        onChange={(e) => handleTextChange(e.target.value)}
        rows={3}
        placeholder={"Name, Email\nAlice, alice@club.com\nBob, bob@club.com"}
        className="w-full rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
      />

      {/* Preview */}
      {preview.length > 0 && (
        <div className="rounded-md border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="px-3 py-1.5 bg-stone-50 dark:bg-stone-800/50 text-[11px] text-stone-500 font-medium">
            {preview.length} member{preview.length === 1 ? "" : "s"} found
          </div>
          <div className="max-h-32 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/50">
            {preview.slice(0, 20).map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-1 text-xs">
                <span className="text-stone-700 dark:text-stone-300 w-32 truncate">{m.name}</span>
                <span className="text-stone-400 truncate">{m.email}</span>
              </div>
            ))}
            {preview.length > 20 && (
              <div className="px-3 py-1 text-[10px] text-stone-400">+{preview.length - 20} more</div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || preview.length === 0}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
        >
          {submitting ? "Adding..." : `Add ${preview.length} Member${preview.length === 1 ? "" : "s"}`}
        </button>
        <button type="button" onClick={() => { setOpen(false); setCsv(""); setPreview([]); }} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
