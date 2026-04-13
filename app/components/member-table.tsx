"use client";

import { useState, useMemo } from "react";
import type { MemberRow } from "@/lib/member-queries";

type SortKey = "name" | "email" | "city" | "joined" | "polls_sent" | "polls_voted" | "events_attended";
type SortDir = "asc" | "desc";

export function MemberTable({ members }: { members: MemberRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return members;
    return members.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q)
    );
  }, [members, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      const ak = a[sortKey];
      const bk = b[sortKey];
      if (typeof ak === "string" && typeof bk === "string") {
        cmp = ak.localeCompare(bk);
      } else {
        cmp = (ak as number) - (bk as number);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "email" || key === "city" ? "asc" : "desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-warm-300 ml-1">&#8597;</span>;
    return <span className="text-accent ml-1">{sortDir === "asc" ? "&#9650;" : "&#9660;"}</span>;
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or city..."
          className="w-full max-w-md rounded-lg border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
        />
      </div>

      {/* Count */}
      <div className="mb-3 text-sm text-warm-500">
        {filtered.length === members.length
          ? `${members.length} members`
          : `${filtered.length} of ${members.length} members`}
      </div>

      {/* Table */}
      <div className="border border-warm-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-50 border-b border-warm-200">
              <Th col="name" label="Name" toggleSort={toggleSort}><SortIcon col="name" /></Th>
              <Th col="email" label="Email" toggleSort={toggleSort}><SortIcon col="email" /></Th>
              <Th col="city" label="City" toggleSort={toggleSort}><SortIcon col="city" /></Th>
              <Th col="joined" label="Joined" toggleSort={toggleSort}><SortIcon col="joined" /></Th>
              <Th col="polls_sent" label="Polls" toggleSort={toggleSort} align="right"><SortIcon col="polls_sent" /></Th>
              <Th col="polls_voted" label="Voted" toggleSort={toggleSort} align="right"><SortIcon col="polls_voted" /></Th>
              <Th col="events_attended" label="Attended" toggleSort={toggleSort} align="right"><SortIcon col="events_attended" /></Th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-warm-400">
                  {search ? "No members match your search." : "No members yet."}
                </td>
              </tr>
            ) : (
              sorted.map((m) => (
                <tr key={m.id} className="border-b border-warm-100 hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-3">
                    <a href={`/members/${encodeURIComponent(m.email)}`} className="font-semibold text-warm-900 hover:text-accent transition-colors">
                      {m.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-warm-500">{m.email}</td>
                  <td className="px-4 py-3 text-warm-500">{m.city || "—"}</td>
                  <td className="px-4 py-3 text-warm-500 tabular-nums">
                    {new Date(m.joined).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-warm-700 font-medium">{m.polls_sent}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-warm-700 font-medium">{m.polls_voted}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-warm-700 font-medium">{m.events_attended}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ col, label, toggleSort, children, align }: {
  col: SortKey; label: string; toggleSort: (k: SortKey) => void; children: React.ReactNode; align?: "right";
}) {
  return (
    <th
      className={`px-4 py-2.5 font-semibold text-warm-600 cursor-pointer select-none hover:text-warm-900 transition-colors whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`}
      onClick={() => toggleSort(col)}
    >
      {label}{children}
    </th>
  );
}
