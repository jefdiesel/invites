"use client";

import { useState } from "react";
import { submitVote } from "@/lib/actions";

type Option = { id: string; label: string; starts_at: string; capacity: number | null; sort_order: number };
type SlotState = { optionId: string; status: "available" | "unable"; rank: number | null };

export function VoteForm({ token, options }: { token: string; options: Option[] }) {
  const [responseType, setResponseType] = useState<"voted" | "not_interested" | "none_work" | null>(null);
  const [slots, setSlots] = useState<SlotState[]>(
    options.map((o) => ({ optionId: o.id, status: "unable", rank: null }))
  );
  const [flexibility, setFlexibility] = useState<"flexible" | "inflexible">("flexible");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function toggleStatus(i: number) {
    setSlots((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        status: next[i].status === "available" ? "unable" : "available",
        rank: next[i].status === "available" ? null : next[i].rank,
      };
      return reRank(next);
    });
  }

  function moveUp(i: number) {
    const available = slots
      .map((s, idx) => ({ ...s, idx }))
      .filter((s) => s.status === "available" && s.rank !== null);
    available.sort((a, b) => a.rank! - b.rank!);
    const pos = available.findIndex((s) => s.idx === i);
    if (pos <= 0) return;
    setSlots((prev) => {
      const next = [...prev];
      const prevRank = next[available[pos - 1].idx].rank!;
      next[available[pos - 1].idx] = { ...next[available[pos - 1].idx], rank: next[i].rank };
      next[i] = { ...next[i], rank: prevRank };
      return next;
    });
  }

  function moveDown(i: number) {
    const available = slots
      .map((s, idx) => ({ ...s, idx }))
      .filter((s) => s.status === "available" && s.rank !== null);
    available.sort((a, b) => a.rank! - b.rank!);
    const pos = available.findIndex((s) => s.idx === i);
    if (pos < 0 || pos >= available.length - 1) return;
    setSlots((prev) => {
      const next = [...prev];
      const nextRank = next[available[pos + 1].idx].rank!;
      next[available[pos + 1].idx] = { ...next[available[pos + 1].idx], rank: next[i].rank };
      next[i] = { ...next[i], rank: nextRank };
      return next;
    });
  }

  function toggleRanked(i: number) {
    setSlots((prev) => {
      const next = [...prev];
      if (next[i].rank !== null) {
        next[i] = { ...next[i], rank: null };
      } else {
        const maxRank = Math.max(0, ...next.filter((s) => s.rank !== null).map((s) => s.rank!));
        next[i] = { ...next[i], rank: maxRank + 1 };
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

  async function handleSubmit() {
    if (!responseType) return;
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

  // Step 1: Choose response type
  if (responseType === null) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setResponseType("voted")}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 text-left hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
        >
          <div className="font-medium text-sm text-stone-900 dark:text-stone-100">I can make some of these dates</div>
          <div className="text-xs text-stone-400 mt-0.5">Select which dates work and rank your preferences</div>
        </button>
        <button
          onClick={() => setResponseType("none_work")}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 text-left hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
        >
          <div className="font-medium text-sm text-stone-900 dark:text-stone-100">None of these dates work</div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">But I&apos;d still like to attend if new dates are added</div>
        </button>
        <button
          onClick={() => setResponseType("not_interested")}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 text-left hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
        >
          <div className="font-medium text-sm text-stone-500">Not interested this time</div>
          <div className="text-xs text-stone-400 mt-0.5">Skip this event</div>
        </button>
      </div>
    );
  }

  // Quick submit for non-vote types
  if (responseType === "not_interested" || responseType === "none_work") {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 text-center">
          {responseType === "none_work" ? (
            <>
              <div className="text-amber-600 text-2xl mb-2">&#128197;</div>
              <p className="text-sm text-stone-700 dark:text-stone-300">None of these dates work for you, but you&apos;d like to attend if new dates are added.</p>
            </>
          ) : (
            <>
              <div className="text-stone-400 text-2xl mb-2">&#128075;</div>
              <p className="text-sm text-stone-500">You&apos;re not interested in this event. No worries!</p>
            </>
          )}
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Response"}
          </button>
          <button
            onClick={() => setResponseType(null)}
            className="rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-3 text-sm text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Full vote form
  return (
    <div className="space-y-6">
      <button onClick={() => setResponseType(null)} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">&larr; Change response</button>

      <div className="space-y-2">
        {options.map((opt, i) => {
          const slot = slots[i];
          const isAvailable = slot.status === "available";
          return (
            <div
              key={opt.id}
              className={`rounded-lg border p-4 transition-all ${
                isAvailable
                  ? "border-indigo-200 dark:border-indigo-800 bg-white dark:bg-stone-900"
                  : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className={`font-medium text-sm ${isAvailable ? "text-stone-900 dark:text-stone-100" : "text-stone-400"}`}>
                    {opt.label}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-stone-400">{new Date(opt.starts_at).toLocaleString()}</span>
                    {opt.capacity && <span className="text-[10px] text-stone-400">{opt.capacity} seats</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleStatus(i)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    isAvailable
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-600"
                  }`}
                >
                  {isAvailable ? "Available" : "Can\u2019t attend"}
                </button>
              </div>

              {isAvailable && (
                <div className="mt-3 flex items-center gap-2">
                  {slot.rank !== null ? (
                    <>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
                        {slot.rank}
                      </span>
                      <span className="text-xs text-stone-400">preference</span>
                      <div className="flex items-center gap-0.5 ml-auto">
                        <button type="button" onClick={() => moveUp(i)} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-xs">&#9650;</button>
                        <button type="button" onClick={() => moveDown(i)} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-xs">&#9660;</button>
                        <button type="button" onClick={() => toggleRanked(i)} className="text-[11px] text-stone-400 hover:text-rose-500 ml-1 transition-colors">clear</button>
                      </div>
                    </>
                  ) : (
                    <button type="button" onClick={() => toggleRanked(i)} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                      + Set preference rank
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Flexibility */}
      <div className="rounded-lg border border-stone-200 dark:border-stone-800 p-4">
        <label className="block text-xs font-medium text-stone-500 mb-3">How flexible are you?</label>
        <div className="flex gap-3">
          {(["flexible", "inflexible"] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setFlexibility(val)}
              className={`flex-1 rounded-md border px-3 py-2.5 text-xs font-medium transition-all ${
                flexibility === val
                  ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                  : "border-stone-200 dark:border-stone-700 text-stone-500 hover:border-stone-300 dark:hover:border-stone-600"
              }`}
            >
              {val === "flexible" ? "Flexible \u2014 I can adjust" : "Inflexible \u2014 hard constraints"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || availableCount === 0}
        className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting..." : availableCount === 0 ? "Mark at least one slot available" : `Submit vote \u2014 ${availableCount} slot${availableCount === 1 ? "" : "s"} available`}
      </button>
    </div>
  );
}
