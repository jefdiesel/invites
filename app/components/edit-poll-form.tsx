"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePoll, updateSlot, deleteSlot, addSlotToPoll } from "@/lib/actions";

type Option = { id: string; label: string; starts_at: string; capacity: number | null; sort_order: number };

export function EditPollForm({
  pollId, initialTitle, initialDescription, initialLocation, initialDeadline, initialOptions, phase,
}: {
  pollId: string; initialTitle: string; initialDescription: string; initialLocation: string;
  initialDeadline: string | null; initialOptions: Option[]; phase: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [location, setLocation] = useState(initialLocation);
  const [deadline, setDeadline] = useState(initialDeadline ?? "");
  const [options, setOptions] = useState(initialOptions);
  const [newLabel, setNewLabel] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCap, setNewCap] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const inputClass = "w-full rounded-lg border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 px-3 py-2.5 text-sm text-warm-900 dark:text-warm-100 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors";

  async function handleSave() {
    setSaving(true);
    await updatePoll(pollId, { title, description, location, deadline: deadline || null });
    for (const opt of options) await updateSlot(opt.id, { label: opt.label, starts_at: opt.starts_at, capacity: opt.capacity });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function handleDeleteSlot(optId: string) { await deleteSlot(optId, pollId); setOptions((prev) => prev.filter((o) => o.id !== optId)); }

  async function handleAddSlot() {
    if (!newLabel || !newDate) return;
    await addSlotToPoll(pollId, newLabel, newDate);
    setNewLabel(""); setNewDate(""); setNewCap(""); router.refresh();
  }

  function updateOption(id: string, field: string, value: string | number | null) {
    setOptions((prev) => prev.map((o) => o.id === id ? { ...o, [field]: value } : o));
  }

  const locked = phase !== "polling";

  return (
    <div className="space-y-6">
      {locked && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            This poll is in <strong>{phase}</strong> phase. Editing details won&apos;t affect existing votes.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-warm-500 mb-1.5">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-warm-500 mb-1.5">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-500 mb-1.5">Deadline</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-500 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-500 mb-2">Date/time slots</label>
        <div className="space-y-2">
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2 rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-3">
              <input value={opt.label} onChange={(e) => updateOption(opt.id, "label", e.target.value)}
                className="flex-1 rounded-lg border border-warm-200 dark:border-warm-700 bg-warm-50 dark:bg-warm-800 px-2.5 py-2 text-sm text-warm-900 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent/20" />
              <input type="datetime-local" value={opt.starts_at} onChange={(e) => updateOption(opt.id, "starts_at", e.target.value)}
                className="rounded-lg border border-warm-200 dark:border-warm-700 bg-warm-50 dark:bg-warm-800 px-2.5 py-2 text-sm text-warm-900 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-accent/20 max-w-[200px]" />
              <input type="number" min="1" value={opt.capacity ?? ""} onChange={(e) => updateOption(opt.id, "capacity", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Seats"
                className="w-16 rounded-lg border border-warm-200 dark:border-warm-700 bg-warm-50 dark:bg-warm-800 px-2 py-2 text-sm text-center tabular-nums text-warm-700 dark:text-warm-300 focus:outline-none focus:ring-2 focus:ring-accent/20" />
              <button onClick={() => handleDeleteSlot(opt.id)} className="text-warm-400 hover:text-rose-500 transition-colors text-sm shrink-0">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="New slot label" className={inputClass}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSlot(); } }} />
          <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={inputClass + " max-w-[200px]"} />
          <input type="number" min="1" value={newCap} onChange={(e) => setNewCap(e.target.value)} placeholder="Seats" className={inputClass + " max-w-[70px]"} />
          <button onClick={handleAddSlot} className="shrink-0 rounded-lg bg-warm-100 dark:bg-warm-800 px-3 py-2.5 text-sm font-medium text-warm-600 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors">Add</button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} disabled={saving || !title}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium">Saved</span>}
        <button onClick={() => router.push(`/poll/${pollId}`)} className="text-sm text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors">
          Back to poll
        </button>
      </div>
    </div>
  );
}
