"use client";

import { useEffect, useState, useCallback } from "react";

type SlotStat = {
  id: string;
  label: string;
  starts_at: string;
  capacity: number | null;
  confirmed: number;
  available: number;
  unable: number;
  onlyOption: number;
  bordaScore: number;
  inflexAvailable: number;
  inflexUnable: number;
  assignedCount: number;
};

type Member = {
  id: string;
  name: string;
  email?: string;
  response_id: string | null;
  flexibility: string | null;
  response_type: string | null;
};

type MemberSlot = {
  response_id: string;
  option_id: string;
  status: string;
  rank: number | null;
};

type Results = {
  poll: Record<string, unknown>;
  options: SlotStat[];
  totalResponses: number;
  votedCount: number;
  notInterestedCount: number;
  noneWorkCount: number;
  flexibleCount: number;
  inflexibleCount: number;
  members: Member[];
  memberSlots: MemberSlot[];
  offers: { response_id: string; option_id: string; name: string; email: string }[];
};

function findBestCombo(
  options: SlotStat[],
  votedMembers: Member[],
  memberSlots: MemberSlot[],
  n: number
): { ids: Set<string>; covered: number; seats: number } {
  if (n >= options.length) {
    const ids = new Set(options.map((o) => o.id));
    const covered = countCovered(ids, votedMembers, memberSlots);
    const seats = options.reduce((s, o) => s + (o.capacity ?? 0), 0);
    return { ids, covered, seats };
  }

  let bestIds = new Set<string>();
  let bestCovered = -1;
  let bestSeats = 0;

  function combos(start: number, current: string[]) {
    if (current.length === n) {
      const ids = new Set(current);
      const covered = countCovered(ids, votedMembers, memberSlots);
      if (covered > bestCovered) {
        bestCovered = covered;
        bestIds = ids;
        bestSeats = current.reduce((s, id) => {
          const opt = options.find((o) => o.id === id);
          return s + (opt?.capacity ?? 0);
        }, 0);
      }
      return;
    }
    for (let i = start; i < options.length; i++) {
      current.push(options[i].id);
      combos(i + 1, current);
      current.pop();
    }
  }
  combos(0, []);
  return { ids: bestIds, covered: bestCovered, seats: bestSeats };
}

function countCovered(selectedIds: Set<string>, votedMembers: Member[], memberSlots: MemberSlot[]): number {
  return votedMembers.filter((m) =>
    memberSlots.some((ms) => ms.response_id === m.response_id && ms.status === "available" && selectedIds.has(ms.option_id))
  ).length;
}

export function LiveResults({ pollId }: { pollId: string }) {
  const [data, setData] = useState<Results | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeBest, setActiveBest] = useState<number | null>(null);

  const fetchResults = useCallback(async () => {
    setRefreshing(true);
    const res = await fetch(`/api/polls/${pollId}/results`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
      if (!initialized && json.options.length > 0) {
        setSelectedSlots(new Set(json.options.map((o: SlotStat) => o.id)));
        setInitialized(true);
      }
    }
    setRefreshing(false);
  }, [pollId, initialized]);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 10_000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  if (!data) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-warm-100" />
        ))}
      </div>
    );
  }

  const votedMembers = data.members.filter((m) => m.response_id && m.response_type === "voted");
  const coveredMembers = votedMembers.filter((m) =>
    data.memberSlots.some((ms) => ms.response_id === m.response_id && ms.status === "available" && selectedSlots.has(ms.option_id))
  );
  const strandedCount = votedMembers.length - coveredMembers.length;
  const coveragePct = votedMembers.length > 0
    ? Math.round((coveredMembers.length / votedMembers.length) * 100)
    : 0;
  const selectedOptions = data.options.filter((o) => selectedSlots.has(o.id));
  const totalSeats = selectedOptions.reduce((s, o) => s + (o.capacity ?? 0), 0);
  const bookedSeats = selectedOptions.reduce((s, o) => s + Math.min(o.available, o.capacity ?? o.available), 0);

  function toggleSlot(id: string) {
    setActiveBest(null);
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyBest(n: number) {
    const result = findBestCombo(data!.options, votedMembers, data!.memberSlots, n);
    setSelectedSlots(result.ids);
    setActiveBest(n);
  }

  function selectAll() {
    setSelectedSlots(new Set(data!.options.map((o) => o.id)));
    setActiveBest(null);
  }

  function generateClaudeExport(): string {
    const poll = data!.poll as { title: string; location: string };
    let text = `Event: ${poll.title}\n`;
    if (poll.location) text += `Location: ${poll.location}\n`;
    text += `${data!.totalResponses} total responses:\n`;
    text += `  ${data!.votedCount} voted (${data!.inflexibleCount} inflexible, ${data!.flexibleCount} flexible)\n`;
    if (data!.noneWorkCount > 0) text += `  ${data!.noneWorkCount} want to attend but no dates work\n`;
    if (data!.notInterestedCount > 0) text += `  ${data!.notInterestedCount} not interested\n`;
    text += `\n`;
    for (const opt of data!.options) {
      text += `Slot: ${opt.label} — ${new Date(opt.starts_at).toLocaleString()}`;
      if (opt.capacity) text += ` (${opt.capacity} seats)`;
      text += `\n`;
      text += `  Available: ${opt.available}   Unable: ${opt.unable}\n`;
      text += `  Only-option for: ${opt.onlyOption} voters\n`;
      text += `  Preference score: ${opt.bordaScore}\n`;
      text += `  Rigid: ${opt.inflexAvailable} available, ${opt.inflexUnable} unable\n\n`;
    }
    text += `Coverage preview:\n`;
    const selectedLabels = Array.from(selectedSlots).map((id) => data!.options.find((o) => o.id === id)?.label).filter(Boolean);
    text += `  Selected (${selectedLabels.join(" + ")}): ${coveredMembers.length}/${votedMembers.length}\n`;
    return text;
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateClaudeExport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const maxAvailable = Math.max(1, ...data.options.map((o) => o.available));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-bold text-warm-900">Results</h2>
          <span className="text-sm text-warm-400 tabular-nums">{data.votedCount} voted</span>
          {data.noneWorkCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
              {data.noneWorkCount} no dates work
            </span>
          )}
          {data.notInterestedCount > 0 && (
            <span className="text-xs text-warm-400">{data.notInterestedCount} not interested</span>
          )}
          {refreshing && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={fetchResults} disabled={refreshing}
            className="rounded-lg px-3 py-1.5 text-sm text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-colors disabled:opacity-50">
            Refresh
          </button>
          <button onClick={handleCopy}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-muted transition-colors">
            {copied ? "Copied" : "Copy for Claude"}
          </button>
        </div>
      </div>

      {/* Best combo optimizer */}
      <div className="rounded-xl border border-warm-200 bg-warm-50 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-warm-700">Find best combination</div>
            <div className="text-xs text-warm-400 mt-0.5">Auto-picks the dates that seat the most people</div>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(data.options.length, 6) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => applyBest(n)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums transition-colors ${
                  activeBest === n
                    ? "bg-accent text-white"
                    : "text-warm-600 bg-warm-100 hover:bg-warm-200"
                }`}
              >
                Best {n}
              </button>
            ))}
            <button
              onClick={selectAll}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                activeBest === null && selectedSlots.size === data.options.length
                  ? "bg-accent text-white font-medium"
                  : "text-warm-500 hover:bg-warm-100"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Coverage summary */}
      <div className="rounded-xl border border-warm-200 bg-white p-5">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <div className="flex-1 h-2.5 rounded-full bg-warm-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${coveragePct === 100 ? "bg-emerald-500" : coveragePct >= 80 ? "bg-accent" : "bg-amber-500"}`}
                style={{ width: `${coveragePct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-5 text-center shrink-0">
            <div>
              <div className="text-xl font-bold tabular-nums text-warm-900">{coveredMembers.length}<span className="text-warm-400 font-normal">/{votedMembers.length}</span></div>
              <div className="text-xs text-warm-400">people covered</div>
            </div>
            {strandedCount > 0 && (
              <div>
                <div className="text-xl font-bold tabular-nums text-amber-600">{strandedCount}</div>
                <div className="text-xs text-amber-600">left out</div>
              </div>
            )}
            <div>
              <div className="text-xl font-bold tabular-nums text-warm-900">{bookedSeats}<span className="text-warm-400 font-normal">/{totalSeats}</span></div>
              <div className="text-xs text-warm-400">seats filled</div>
            </div>
            <div>
              <div className="text-xl font-bold tabular-nums text-accent">{selectedSlots.size}</div>
              <div className="text-xs text-warm-400">{selectedSlots.size === 1 ? "event" : "events"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Slot cards */}
      <div className="space-y-2">
        {data.options.map((opt) => {
          const selected = selectedSlots.has(opt.id);
          const availPct = (opt.available / maxAvailable) * 100;
          return (
            <div key={opt.id} onClick={() => toggleSlot(opt.id)}
              className={`relative rounded-xl border p-4 cursor-pointer transition-all ${
                selected
                  ? "border-warm-300 bg-white"
                  : "border-warm-200/60 bg-warm-50 opacity-40"
              }`}>
              <div className="absolute inset-y-0 left-0 bg-accent/[0.04] rounded-l-xl transition-all" style={{ width: `${availPct}%` }} />
              <div className="relative flex items-center gap-6">
                <div className="text-center w-16 shrink-0">
                  <div className="text-2xl font-bold tabular-nums text-warm-900 leading-none">{opt.available}</div>
                  <div className="text-xs text-warm-400 mt-1">available</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-warm-900">{opt.label}</span>
                    {opt.confirmed === 1 && <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">confirmed</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-warm-400">{new Date(opt.starts_at).toLocaleString()}</span>
                    {opt.capacity != null && (
                      <span className={`text-xs font-medium tabular-nums ${
                        opt.available > opt.capacity ? "text-rose-500" : opt.available >= opt.capacity * 0.8 ? "text-amber-500" : "text-warm-400"
                      }`}>
                        {Math.min(opt.available, opt.capacity)}/{opt.capacity} seats
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-5 text-center shrink-0">
                  <div title="Can't make this date">
                    <div className="text-sm font-semibold tabular-nums text-warm-500">{opt.unable}</div>
                    <div className="text-xs text-warm-400">can&apos;t</div>
                  </div>
                  <div title="Preference score">
                    <div className="text-sm font-semibold tabular-nums text-warm-500">{opt.bordaScore}</div>
                    <div className="text-xs text-warm-400">preference</div>
                  </div>
                  {opt.inflexAvailable > 0 && (
                    <div title="People with hard schedule constraints">
                      <div className="text-sm font-semibold tabular-nums text-rose-600">{opt.inflexAvailable}</div>
                      <div className="text-xs text-warm-400">rigid</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-warm-400">Click dates to select/deselect. Coverage updates live above.</p>

      {/* Member grid */}
      {votedMembers.length > 0 && (
        <div className="rounded-xl border border-warm-200 overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-100">
                <th className="text-left px-3 py-2.5 text-warm-400 font-medium text-xs">Member</th>
                <th className="text-left px-2 py-2.5 text-warm-400 font-medium text-xs w-16">Flex</th>
                {data.options.map((opt) => (
                  <th key={opt.id} className={`text-center px-1.5 py-2.5 font-medium text-xs max-w-[72px] truncate ${
                    selectedSlots.has(opt.id) ? "text-warm-600" : "text-warm-300"
                  }`}>{opt.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {votedMembers.map((m) => {
                const memberVotes = data.memberSlots.filter((ms) => ms.response_id === m.response_id);
                const isCovered = memberVotes.some((mv) => mv.status === "available" && selectedSlots.has(mv.option_id));
                return (
                  <tr key={m.id} className={`border-b border-warm-50 ${!isCovered ? "bg-amber-50/50" : "hover:bg-warm-50"}`}>
                    <td className={`px-3 py-2 font-medium ${!isCovered ? "text-amber-700" : "text-warm-700"}`}>
                      {m.email ? (
                        <a href={`/members/${encodeURIComponent(m.email)}`} className="hover:text-accent transition-colors">{m.name}</a>
                      ) : m.name}
                    </td>
                    <td className="px-2 py-2">
                      {m.flexibility === "inflexible" ? (
                        <span className="text-xs font-semibold text-rose-500">rigid</span>
                      ) : (
                        <span className="text-xs text-warm-300">flex</span>
                      )}
                    </td>
                    {data.options.map((opt) => {
                      const vote = memberVotes.find((mv) => mv.option_id === opt.id);
                      if (!vote) return <td key={opt.id} className="text-center px-1.5 py-2 text-warm-200">-</td>;
                      return (
                        <td key={opt.id} className="text-center px-1.5 py-2">
                          {vote.status === "available" ? (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${
                              vote.rank !== null && vote.rank <= 2
                                ? "bg-accent-muted text-accent"
                                : "bg-emerald-500/10 text-emerald-600"
                            }`}>
                              {vote.rank !== null ? vote.rank : "\u2713"}
                            </span>
                          ) : (
                            <span className="text-warm-300">\u2715</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
