"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePoll, updateSlot, deleteSlot, addSlotToPoll } from "@/lib/actions";

type Option = { id: string; label: string; starts_at: string; capacity: number | null; sort_order: number };

export function EditPollForm({
  pollId,
  initialTitle,
  initialDescription,
  initialLocation,
  initialDeadline,
  initialOptions,
  phase,
}: {
  pollId: string;
  initialTitle: string;
  initialDescription: string;
  initialLocation: string;
  initialDeadline: string | null;
  initialOptions: Option[];
  phase: string;
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

  const inputClass = "w-full rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors";

  async function handleSave() {
    setSaving(true);
    await updatePoll(pollId, {
      title,
      description,
      location,
      deadline: deadline || null,
    });

    // Save slot edits
    for (const opt of options) {
      await updateSlot(opt.id, {
        label: opt.label,
        starts_at: opt.starts_at,
        capacity: opt.capacity,
      });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDeleteSlot(optId: string) {
    await deleteSlot(optId, pollId);
    setOptions((prev) => prev.filter((o) => o.id !== optId));
  }

  async function handleAddSlot() {
    if (!newLabel || !newDate) return;
    await addSlotToPoll(pollId, newLabel, newDate);
    setNewLabel("");
    setNewDate("");
    setNewCap("");
    router.refresh();
  }

  function updateOption(id: string, field: string, value: string | number | null) {
    setOptions((prev) => prev.map((o) => o.id === id ? { ...o, [field]: value } : o));
  }

  const locked = phase !== "polling";

  return (
    <div className="space-y-6">
      {locked && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3">
          <p className="text-[13px] text-amber-700 dark:text-amber-300">
            This poll is in <strong>{phase}</strong> phase. Editing details won&apos;t affect existing votes, but be careful with slot changes.
          </p>
        </div>
      )}

      {/* Poll details */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Deadline</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
        </div>
      </div>

      {/* Slots */}
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-2">Date/time slots</label>
        <div className="space-y-2">
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
              <input
                value={opt.label}
                onChange={(e) => updateOption(opt.id, "label", e.target.value)}
                className="flex-1 rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2.5 py-1.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                type="datetime-local"
                value={opt.starts_at}
                onChange={(e) => updateOption(opt.id, "starts_at", e.target.value)}
                className="rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2.5 py-1.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[200px]"
              />
              <input
                type="number"
                min="1"
                value={opt.capacity ?? ""}
                onChange={(e) => updateOption(opt.id, "capacity", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Seats"
                className="w-16 rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2 py-1.5 text-xs text-center tabular-nums text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                onClick={() => handleDeleteSlot(opt.id)}
                className="text-stone-400 hover:text-rose-500 transition-colors text-xs shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Add slot */}
        <div className="flex gap-2 mt-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="New slot label"
            className={inputClass}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSlot(); } }}
          />
          <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={inputClass + " max-w-[200px]"} />
          <input type="number" min="1" value={newCap} onChange={(e) => setNewCap(e.target.value)} placeholder="Seats" className={inputClass + " max-w-[70px]"} />
          <button onClick={handleAddSlot} className="shrink-0 rounded-md bg-stone-100 dark:bg-stone-800 px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">Add</button>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !title}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && <span className="text-xs text-emerald-600 font-medium">Saved</span>}
        <button
          onClick={() => router.push(`/poll/${pollId}`)}
          className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        >
          Back to poll
        </button>
      </div>
    </div>
  );
}
