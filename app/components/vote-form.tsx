"use client";

import { useState } from "react";
import { submitVote } from "@/lib/actions";

type Option = { id: string; label: string; starts_at: string; capacity: number | null; sort_order: number };
type SlotState = { optionId: string; status: "available" | "unable"; rank: number | null };

export function VoteForm({ token, options }: { token: string; options: Option[] }) {
  const [slots, setSlots] = useState<SlotState[]>(
    options.map((o) => ({ optionId: o.id, status: "unable", rank: null }))
  );
  const [flexibility, setFlexibility] = useState<"flexible" | "inflexible">("flexible");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function toggleSlot(i: number) {
    setSlots((prev) => {
      const next = [...prev];
      if (next[i].status === "available") {
        // Deselect — remove rank
        next[i] = { ...next[i], status: "unable", rank: null };
      } else {
        // Select — auto-rank as next preference
        const maxRank = Math.max(0, ...next.filter((s) => s.rank !== null).map((s) => s.rank!));
        next[i] = { ...next[i], status: "available", rank: maxRank + 1 };
      }
      return reRank(next);
    });
  }

  function reRank(s: SlotState[]): SlotState[] {
    const ranked = s
      .map((slot, idx) => ({ slot, idx }))
      .filter((x) => x.slot.status === "available" && x.slot.rank !== null)
      .sort((a, b) => a.slot.rank! - b.slot.rank!);
    const result = [...s];
    ranked.forEach((x, pos) => {
      result[x.idx] = { ...result[x.idx], rank: pos + 1 };
    });
    return result;
  }

  async function handleSubmit(responseType: "voted" | "not_interested" | "none_work") {
    setSubmitting(true);
    setError("");
    try {
      await submitVote(token, flexibility, slots, responseType);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-emerald-600 text-lg">&#10003;</span>
        </div>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Vote submitted</h2>
        <p className="text-sm text-stone-500 mt-1">Your response is locked. You can close this page.</p>
      </div>
    );
  }

  const availableCount = slots.filter((s) => s.status === "available").length;

  return (
    <div className="space-y-6">
      {/* Date cards — tap to toggle */}
      <div className="space-y-3">
        {options.map((opt, i) => {
          const slot = slots[i];
          const isAvailable = slot.status === "available";
          const d = new Date(opt.starts_at);
          const day = d.toLocaleDateString("en-US", { weekday: "long" });
          const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
          const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleSlot(i)}
              className={`w-full rounded-xl border-2 p-5 text-center transition-all ${
                isAvailable
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-500"
              }`}
            >
              <div className="text-xl font-bold text-stone-900 dark:text-stone-100">
                {opt.label || `${day}, ${date}`}
              </div>
              <div className="text-base text-stone-600 dark:text-stone-300 mt-1 font-medium">
                {time}
                {opt.capacity && <span className="ml-2 text-sm font-normal text-stone-400">({opt.capacity} seats)</span>}
              </div>
              {isAvailable && slot.rank !== null && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold">{slot.rank}</span>
                  {slot.rank === 1 ? "1st choice" : slot.rank === 2 ? "2nd choice" : slot.rank === 3 ? "3rd choice" : `${slot.rank}th choice`}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Flexibility — only show when dates selected */}
      {availableCount > 0 && (
        <div>
          <label className="block text-sm font-medium text-stone-500 mb-2 text-center">How flexible are you?</label>
          <div className="flex gap-3">
            {(["flexible", "inflexible"] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setFlexibility(val)}
                className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                  flexibility === val
                    ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                    : "border-stone-200 dark:border-stone-700 text-stone-500 hover:border-stone-300"
                }`}
              >
                {val === "flexible" ? "Flexible \u2014 I can adjust" : "Inflexible \u2014 hard constraints"}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-rose-600 dark:text-rose-400 text-center">{error}</p>}

      {/* Submit */}
      <button
        type="button"
        onClick={() => handleSubmit("voted")}
        disabled={submitting || availableCount === 0}
        className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting..." : availableCount === 0 ? "Tap a date above" : `Submit \u2014 ${availableCount} date${availableCount === 1 ? "" : "s"} selected`}
      </button>

      {/* Alt options */}
      <div className="flex justify-center gap-4 pt-2">
        <button
          onClick={() => handleSubmit("none_work")}
          disabled={submitting}
          className="text-sm font-medium text-amber-500 hover:text-amber-400 hover:underline disabled:opacity-50"
        >
          None of these work for me
        </button>
        <span className="text-stone-500">|</span>
        <button
          onClick={() => handleSubmit("not_interested")}
          disabled={submitting}
          className="text-sm font-medium text-stone-400 hover:text-stone-300 hover:underline disabled:opacity-50"
        >
          Not interested
        </button>
      </div>
    </div>
  );
}
