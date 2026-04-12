"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewPollForm({ action }: { action: (formData: FormData) => Promise<{ id: string }> }) {
  const [slots, setSlots] = useState<{ label: string; starts_at: string; capacity: number | null }[]>([]);
  const [slotLabel, setSlotLabel] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [slotCapacity, setSlotCapacity] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function addSlot() {
    if (!slotLabel || !slotDate) return;
    setSlots([...slots, { label: slotLabel, starts_at: slotDate, capacity: slotCapacity ? parseInt(slotCapacity, 10) : null }]);
    setSlotLabel("");
    setSlotDate("");
    setSlotCapacity("");
  }

  function removeSlot(i: number) {
    setSlots(slots.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    fd.set("slots", JSON.stringify(slots));
    const { id } = await action(fd);
    router.push(`/poll/${id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-stone-300 dark:border-stone-700 py-4 text-[13px] text-stone-400 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        + New Poll
      </button>
    );
  }

  const inputClass = "w-full rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4">
      <h2 className="text-[15px] font-semibold text-stone-900 dark:text-stone-100">New poll</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Title</label>
          <input name="title" required placeholder="Spring Mixer" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Location</label>
          <input name="location" placeholder="The Rowing Club" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Description</label>
        <textarea name="description" rows={2} placeholder="Optional details for voters..." className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Deadline</label>
        <input name="deadline" type="datetime-local" className={inputClass + " max-w-xs"} />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-2">Candidate slots</label>
        {slots.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {slots.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm bg-stone-50 dark:bg-stone-800/50 rounded-md px-3 py-2">
                <span className="text-xs font-medium text-stone-400 tabular-nums w-5">{i + 1}.</span>
                <span className="font-medium text-stone-700 dark:text-stone-200">{s.label}</span>
                <span className="text-stone-400 text-xs">{new Date(s.starts_at).toLocaleString()}</span>
                {s.capacity && <span className="text-stone-400 text-xs">{s.capacity} seats</span>}
                <button type="button" onClick={() => removeSlot(i)} className="ml-auto text-stone-400 hover:text-rose-500 transition-colors text-xs">Remove</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={slotLabel}
            onChange={(e) => setSlotLabel(e.target.value)}
            placeholder="Monday Evening"
            className={inputClass}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSlot(); } }}
          />
          <input
            type="datetime-local"
            value={slotDate}
            onChange={(e) => setSlotDate(e.target.value)}
            className={inputClass + " max-w-[220px]"}
          />
          <input
            type="number"
            min="1"
            value={slotCapacity}
            onChange={(e) => setSlotCapacity(e.target.value)}
            placeholder="Seats"
            className={inputClass + " max-w-[80px]"}
          />
          <button type="button" onClick={addSlot} className="shrink-0 rounded-md bg-stone-100 dark:bg-stone-800 px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
            Add
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || slots.length === 0}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Creating..." : "Create Poll"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
