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

export function LiveResults({ pollId }: { pollId: string }) {
  const [data, setData] = useState<Results | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

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
          <div key={i} className="h-28 rounded-lg bg-stone-100 dark:bg-stone-800/50" />
        ))}
      </div>
    );
  }

  const votedMembers = data.members.filter((m) => m.response_id && m.response_type === "voted");
  const coveredMembers = votedMembers.filter((m) => {
    const memberVotes = data.memberSlots.filter(
      (ms) => ms.response_id === m.response_id && ms.status === "available" && selectedSlots.has(ms.option_id)
    );
    return memberVotes.length > 0;
  });
  const strandedCount = votedMembers.length - coveredMembers.length;
  const coveragePct = votedMembers.length > 0
    ? Math.round((coveredMembers.length / votedMembers.length) * 100)
    : 0;

  function toggleSlot(id: string) {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
      text += `  Borda score: ${opt.bordaScore}\n`;
      text += `  Inflexible: ${opt.inflexAvailable} available, ${opt.inflexUnable} unable\n\n`;
    }

    text += `Coverage preview:\n`;
    const selectedLabels = Array.from(selectedSlots)
      .map((id) => data!.options.find((o) => o.id === id)?.label)
      .filter(Boolean);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-[15px] font-semibold text-stone-900 dark:text-stone-100">Results</h2>
          <span className="text-xs text-stone-400 tabular-nums">{data.votedCount} voted</span>
          {data.noneWorkCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
              {data.noneWorkCount} want to attend, no dates work
            </span>
          )}
          {data.notInterestedCount > 0 && (
            <span className="text-[10px] text-stone-400">{data.notInterestedCount} not interested</span>
          )}
          {data.inflexibleCount > 0 && (
            <span className="text-[10px] text-stone-400">
              ({data.inflexibleCount} inflexible)
            </span>
          )}
          {refreshing && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={fetchResults} disabled={refreshing}
            className="rounded-md px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50">
            Refresh
          </button>
          <button onClick={handleCopy}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors">
            {copied ? "Copied" : "Copy for Claude"}
          </button>
        </div>
      </div>

      {/* Slot cards */}
      <div className="space-y-2">
        {data.options.map((opt) => {
          const selected = selectedSlots.has(opt.id);
          const availPct = (opt.available / maxAvailable) * 100;
          return (
            <div key={opt.id} onClick={() => toggleSlot(opt.id)}
              className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                selected
                  ? "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900"
                  : "border-stone-200/60 dark:border-stone-800/60 bg-stone-50 dark:bg-stone-900/50 opacity-50"
              }`}>
              <div className="absolute inset-y-0 left-0 bg-indigo-500/[0.04] dark:bg-indigo-400/[0.06] rounded-l-lg transition-all" style={{ width: `${availPct}%` }} />
              <div className="relative flex items-center gap-6">
                <div className="text-center w-16 shrink-0">
                  <div className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-100 leading-none">{opt.available}</div>
                  <div className="text-[10px] text-stone-400 mt-1">available</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-stone-900 dark:text-stone-100">{opt.label}</span>
                    {opt.capacity && <span className="text-[10px] text-stone-400">{opt.capacity} seats</span>}
                    {opt.confirmed === 1 && <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">confirmed</span>}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">{new Date(opt.starts_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-5 text-center shrink-0">
                  <div>
                    <div className="text-sm font-semibold tabular-nums text-stone-500">{opt.unable}</div>
                    <div className="text-[10px] text-stone-400">unable</div>
                  </div>
                  <div>
                    <div className={`text-sm font-semibold tabular-nums ${opt.onlyOption > 0 ? "text-amber-600 dark:text-amber-400" : "text-stone-400"}`}>{opt.onlyOption}</div>
                    <div className="text-[10px] text-stone-400">stranded</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold tabular-nums text-stone-500">{opt.bordaScore}</div>
                    <div className="text-[10px] text-stone-400">borda</div>
                  </div>
                  {opt.inflexAvailable > 0 && (
                    <div>
                      <div className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">{opt.inflexAvailable}</div>
                      <div className="text-[10px] text-stone-400">inflexible</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coverage */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 flex-1">
          <span className="text-xs font-medium text-stone-500 shrink-0">Coverage</span>
          <div className="flex-1 max-w-xs h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${coveragePct === 100 ? "bg-emerald-500" : coveragePct >= 80 ? "bg-indigo-500" : "bg-amber-500"}`}
              style={{ width: `${coveragePct}%` }} />
          </div>
          <span className="text-sm font-semibold tabular-nums text-stone-900 dark:text-stone-100">{coveredMembers.length}/{votedMembers.length}</span>
          <span className="text-xs text-stone-400">{coveragePct}%</span>
        </div>
        {strandedCount > 0 && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{strandedCount} stranded</span>}
      </div>
      <p className="text-[11px] text-stone-400 -mt-5">Click slots to toggle selection and preview coverage.</p>

      {/* Member grid */}
      {votedMembers.length > 0 && (
        <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto bg-white dark:bg-stone-900">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-800">
                <th className="text-left px-3 py-2 text-stone-400 font-medium text-[11px]">Member</th>
                <th className="text-left px-2 py-2 text-stone-400 font-medium text-[11px] w-16">Flex</th>
                {data.options.map((opt) => (
                  <th key={opt.id} className="text-center px-1.5 py-2 text-stone-400 font-medium text-[10px] max-w-[72px] truncate">{opt.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {votedMembers.map((m) => {
                const memberVotes = data.memberSlots.filter((ms) => ms.response_id === m.response_id);
                return (
                  <tr key={m.id} className="border-b border-stone-50 dark:border-stone-800/30 hover:bg-stone-50 dark:hover:bg-stone-800/30">
                    <td className="px-3 py-1.5 text-stone-700 dark:text-stone-300 font-medium">{m.name}</td>
                    <td className="px-2 py-1.5">
                      {m.flexibility === "inflexible" ? (
                        <span className="text-[10px] font-semibold text-rose-500">rigid</span>
                      ) : (
                        <span className="text-[10px] text-stone-300 dark:text-stone-600">flex</span>
                      )}
                    </td>
                    {data.options.map((opt) => {
                      const vote = memberVotes.find((mv) => mv.option_id === opt.id);
                      if (!vote) return <td key={opt.id} className="text-center px-1.5 py-1.5 text-stone-200 dark:text-stone-700">-</td>;
                      return (
                        <td key={opt.id} className="text-center px-1.5 py-1.5">
                          {vote.status === "available" ? (
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                              vote.rank !== null && vote.rank <= 2
                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}>
                              {vote.rank !== null ? vote.rank : "\u2713"}
                            </span>
                          ) : (
                            <span className="text-stone-300 dark:text-stone-600">\u2715</span>
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
