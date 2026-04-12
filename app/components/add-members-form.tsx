"use client";

import { useState } from "react";

export function AddMembersForm({
  pollId,
  action,
  memberCount,
}: {
  pollId: string;
  action: (pollId: string, members: { name: string; email: string }[]) => Promise<void>;
  memberCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const lines = csv.split("\n").filter((l) => l.trim());
    const members = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return { name: parts[0] || "", email: parts[1] || "" };
    }).filter((m) => m.name && m.email);

    if (members.length > 0) {
      await action(pollId, members);
    }
    setCsv("");
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
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <label className="block text-xs text-stone-500">
        One per line: name, email
      </label>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={3}
        placeholder={"Alice, alice@club.com\nBob, bob@club.com"}
        className="w-full rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors">
          {submitting ? "Adding..." : "Add & Generate Links"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
