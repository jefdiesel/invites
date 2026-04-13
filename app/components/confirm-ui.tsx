"use client";

import { useState, useEffect } from "react";
import { toggleConfirmed, updateCapacity, updatePhase, addSlotToPoll, assignMembers, sendNotifications } from "@/lib/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Option = {
  id: string; label: string; starts_at: string; capacity: number | null; confirmed: number; sort_order: number;
  available: number; unable: number; onlyOption: number; bordaScore: number; assignedCount: number;
};

export function ConfirmUI({
  pollId, initialOptions, phase, totalResponses, hasOffers,
}: {
  pollId: string; initialOptions: Option[]; phase: string; totalResponses: number; hasOffers: boolean;
}) {
  const [options, setOptions] = useState(initialOptions);
  const [newLabel, setNewLabel] = useState("");
  const [newDate, setNewDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [assigned, setAssigned] = useState(hasOffers);
  const router = useRouter();

  useEffect(() => { setOptions(initialOptions); setAssigned(hasOffers); }, [initialOptions, hasOffers]);

  async function handleToggle(id: string) {
    await toggleConfirmed(id);
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, confirmed: o.confirmed ? 0 : 1 } : o)));
    if (assigned) setAssigned(false);
  }

  async function handleCapacity(id: string, val: string) {
    const cap = val === "" ? null : parseInt(val, 10);
    await updateCapacity(id, cap);
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, capacity: cap } : o)));
  }

  async function handleAddSlot() {
    if (!newLabel || !newDate) return;
    await addSlotToPoll(pollId, newLabel, newDate);
    setNewLabel(""); setNewDate(""); router.refresh();
  }

  async function handleMoveToConfirm() { await updatePhase(pollId, "confirming"); router.refresh(); }

  async function handleAssign() {
    setSaving(true); await assignMembers(pollId); setAssigned(true); setSaving(false); router.refresh();
  }

  async function handleNotify() {
    setSaving(true); await sendNotifications(pollId); setSaving(false); router.push(`/poll/${pollId}`);
  }

  const confirmed = options.filter((o) => o.confirmed);
  const inputClass = "rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors";

  return (
    <div className="space-y-6">
      {phase === "polling" && (
        <div className="rounded-xl border border-accent/30 bg-accent-muted p-4 flex items-center justify-between">
          <p className="text-sm text-warm-700">This poll is still accepting votes.</p>
          <button onClick={handleMoveToConfirm}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-light transition-colors">
            Close Voting
          </button>
        </div>
      )}

      <div className="space-y-2">
        {options.map((opt) => (
          <div key={opt.id} className={`rounded-xl border p-4 transition-colors ${
            opt.confirmed
              ? "border-emerald-300 bg-emerald-50/30"
              : "border-warm-200 bg-white"
          }`}>
            <div className="flex items-center gap-4">
              <button onClick={() => handleToggle(opt.id)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                  opt.confirmed ? "border-emerald-500 bg-emerald-500 text-white" : "border-warm-300 text-transparent hover:border-emerald-400"
                }`}>&#10003;</button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {assigned && opt.confirmed ? (
                    <Link href={`/poll/${pollId}/slot/${opt.id}`} className="font-semibold text-sm text-accent hover:text-accent-light transition-colors">
                      {opt.label} &rarr;
                    </Link>
                  ) : (
                    <span className="font-semibold text-sm text-warm-900">{opt.label}</span>
                  )}
                </div>
                <div className="text-sm text-warm-400">{new Date(opt.starts_at).toLocaleString()}</div>
              </div>

              <div className="flex items-center gap-4 text-center shrink-0">
                <div>
                  <div className="text-sm font-bold tabular-nums text-warm-900">{opt.available}</div>
                  <div className="text-xs text-warm-400">avail</div>
                </div>
                {assigned && opt.confirmed && (
                  <div>
                    <div className="text-sm font-bold tabular-nums text-emerald-600">{opt.assignedCount}</div>
                    <div className="text-xs text-warm-400">assigned</div>
                  </div>
                )}
                {opt.onlyOption > 0 && (
                  <div>
                    <div className="text-sm font-bold tabular-nums text-amber-600">{opt.onlyOption}</div>
                    <div className="text-xs text-warm-400">only option</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold tabular-nums text-warm-400">{opt.bordaScore}</div>
                  <div className="text-xs text-warm-400">preference</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <label className="text-xs text-warm-400">cap</label>
                <input type="number" min="1" value={opt.capacity ?? ""} onChange={(e) => handleCapacity(opt.id, e.target.value)}
                  placeholder={"\u221E"}
                  className="w-14 rounded-lg border border-warm-200 bg-warm-50 px-2 py-1 text-sm text-center tabular-nums text-warm-700 focus:outline-none focus:ring-2 focus:ring-accent/20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add slot */}
      <div className="rounded-xl border border-dashed border-warm-300 p-4">
        <p className="text-xs text-warm-400 mb-2">Add overflow slot</p>
        <div className="flex gap-2">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label" className={inputClass + " flex-1"} />
          <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={inputClass} />
          <button onClick={handleAddSlot} className="shrink-0 rounded-lg bg-warm-100 px-3 py-2.5 text-sm font-medium text-warm-600 hover:bg-warm-200 transition-colors">Add</button>
        </div>
      </div>

      {/* Actions */}
      {(phase === "confirming" || confirmed.length > 0) && (
        <div className="pt-4 border-t border-warm-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-warm-700">
                {confirmed.length} slot{confirmed.length === 1 ? "" : "s"} confirmed
              </span>
              <span className="text-sm text-warm-400 ml-2">{totalResponses} responded</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAssign} disabled={confirmed.length === 0 || saving}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {saving ? "Assigning..." : assigned ? "Re-assign" : "Assign Members"}
              </button>
              {assigned && phase === "confirming" && (
                <button onClick={handleNotify} disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors">
                  Send Notifications
                </button>
              )}
            </div>
          </div>
          {assigned && <p className="text-xs text-emerald-600">Members assigned. Click a slot name above to view the guest list.</p>}
          {!assigned && <p className="text-xs text-warm-400">Assigns members to confirmed slots by preference (most constrained first). No emails are sent.</p>}
        </div>
      )}
    </div>
  );
}
