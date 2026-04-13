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
        className="w-full rounded-xl border border-dashed border-warm-300 dark:border-warm-700 py-4 text-sm font-medium text-warm-400 hover:border-accent hover:text-accent transition-colors"
      >
        + New Poll
      </button>
    );
  }

  const inputClass = "w-full rounded-lg border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 px-3 py-2.5 text-sm text-warm-900 dark:text-warm-100 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors";

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-6 space-y-4">
      <h2 className="text-base font-bold text-warm-900 dark:text-warm-100">New poll</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-warm-500 mb-1.5">Title</label>
          <input name="title" required placeholder="Spring Mixer" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-500 mb-1.5">Location</label>
          <input name="location" placeholder="The Rowing Club" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-500 mb-1.5">Description</label>
        <textarea name="description" rows={2} placeholder="Optional details for voters..." className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-500 mb-1.5">Deadline</label>
        <input name="deadline" type="datetime-local" className={inputClass + " max-w-xs"} />
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-500 mb-2">Candidate slots</label>
        {slots.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {slots.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm bg-warm-50 dark:bg-warm-800/50 rounded-lg px-3 py-2.5">
                <span className="text-sm font-medium text-warm-400 tabular-nums w-5">{i + 1}.</span>
                <span className="font-medium text-warm-700 dark:text-warm-200">{s.label}</span>
                <span className="text-warm-400 text-sm">{new Date(s.starts_at).toLocaleString()}</span>
                {s.capacity && <span className="text-warm-400 text-sm">{s.capacity} seats</span>}
                <button type="button" onClick={() => removeSlot(i)} className="ml-auto text-warm-400 hover:text-rose-500 transition-colors text-sm">Remove</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input value={slotLabel} onChange={(e) => setSlotLabel(e.target.value)} placeholder="Monday Evening" className={inputClass}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSlot(); } }} />
          <input type="datetime-local" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className={inputClass + " max-w-[220px]"} />
          <input type="number" min="1" value={slotCapacity} onChange={(e) => setSlotCapacity(e.target.value)} placeholder="Seats" className={inputClass + " max-w-[80px]"} />
          <button type="button" onClick={addSlot} className="shrink-0 rounded-lg bg-warm-100 dark:bg-warm-800 px-3 py-2.5 text-sm font-medium text-warm-600 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors">
            Add
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={submitting || slots.length === 0}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {submitting ? "Creating..." : "Create Poll"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
