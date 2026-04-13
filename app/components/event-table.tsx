"use client";

import { useState, useMemo } from "react";

type EventRow = {
  id: string;
  title: string;
  location: string;
  event_date: string;
  capacity: number | null;
  avg_stars: number | null;
  review_count: number;
  ticket_count: number;
};

type SortKey = "title" | "location" | "event_date" | "capacity" | "avg_stars" | "review_count" | "ticket_count";
type SortDir = "asc" | "desc";

export function EventTable({ events }: { events: EventRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("event_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return events;
    return events.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
    );
  }, [events, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      const ak = a[sortKey];
      const bk = b[sortKey];
      if (ak == null && bk == null) cmp = 0;
      else if (ak == null) cmp = 1;
      else if (bk == null) cmp = -1;
      else if (typeof ak === "string" && typeof bk === "string") cmp = ak.localeCompare(bk);
      else cmp = (ak as number) - (bk as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "title" || key === "location" ? "asc" : "desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-warm-300 ml-1">&#8597;</span>;
    return <span className="text-accent ml-1">{sortDir === "asc" ? "&#9650;" : "&#9660;"}</span>;
  }

  return (
    <div>
      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by event name or location..."
          className="w-full max-w-md rounded-lg border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
      </div>

      <div className="mb-3 text-sm text-warm-500">
        {filtered.length === events.length ? `${events.length} events` : `${filtered.length} of ${events.length} events`}
      </div>

      <div className="border border-warm-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-50 border-b border-warm-200">
              <Th col="title" label="Event" toggleSort={toggleSort}><SortIcon col="title" /></Th>
              <Th col="location" label="Location" toggleSort={toggleSort}><SortIcon col="location" /></Th>
              <Th col="event_date" label="Date" toggleSort={toggleSort}><SortIcon col="event_date" /></Th>
              <Th col="capacity" label="Capacity" toggleSort={toggleSort} align="right"><SortIcon col="capacity" /></Th>
              <Th col="avg_stars" label="Rating" toggleSort={toggleSort} align="right"><SortIcon col="avg_stars" /></Th>
              <Th col="review_count" label="Reviews" toggleSort={toggleSort} align="right"><SortIcon col="review_count" /></Th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-warm-400">{search ? "No events match." : "No events yet."}</td></tr>
            ) : (
              sorted.map((e) => (
                <tr key={e.id} className="border-b border-warm-100 hover:bg-warm-50 transition-colors">
                  <td className="px-4 py-3">
                    <a href={`/events/${e.id}`} className="font-semibold text-warm-900 hover:text-accent transition-colors">{e.title}</a>
                  </td>
                  <td className="px-4 py-3 text-warm-500">{e.location || "—"}</td>
                  <td className="px-4 py-3 text-warm-500 tabular-nums whitespace-nowrap">
                    {new Date(e.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-warm-700 font-medium">{e.capacity ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {e.avg_stars !== null ? (
                      <span className="font-medium text-warm-700">{e.avg_stars.toFixed(1)} <span className="text-amber-400">&#9733;</span></span>
                    ) : (
                      <span className="text-warm-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-warm-700 font-medium">{e.review_count}</td>
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
    <th className={`px-4 py-2.5 font-semibold text-warm-600 cursor-pointer select-none hover:text-warm-900 transition-colors whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`}
      onClick={() => toggleSort(col)}>
      {label}{children}
    </th>
  );
}
