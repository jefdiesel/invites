"use client";

import { useState, useEffect, useCallback } from "react";
import { seatBooking, completeBooking, noShowBooking } from "@/lib/restaurant-actions";
import { useRouter } from "next/navigation";

type Table = {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  shape: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
};

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  party_size: number;
  status: string;
  notes: string;
  source: string;
  table_id: string | null;
  duration_minutes: number | null;
  clients?: { name: string; email: string; phone: string };
};

function getTableStatus(table: Table, bookings: Booking[]): {
  status: "open" | "occupied" | "turning" | "reserved";
  booking: Booking | null;
  nextBooking: Booking | null;
  minutesLeft: number | null;
} {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const tableBookings = bookings
    .filter((b) => b.table_id === table.id)
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time));

  // Find current seated booking
  const seated = tableBookings.find((b) => b.status === "seated");

  // Find confirmed booking assigned to this table (reserved)
  const confirmed = tableBookings.find((b) => b.status === "confirmed");

  // Find next upcoming
  const next = tableBookings.find((b) => {
    const bMins = timeToMins(b.booking_time);
    return b.status === "confirmed" && bMins > nowMins;
  });

  if (seated) {
    const bMins = timeToMins(seated.booking_time);
    const bEnd = bMins + (seated.duration_minutes || 90);
    const left = bEnd - nowMins;
    if (left <= 15) return { status: "turning", booking: seated, nextBooking: next ?? null, minutesLeft: left };
    return { status: "occupied", booking: seated, nextBooking: next ?? null, minutesLeft: left };
  }

  if (confirmed) {
    return { status: "reserved", booking: confirmed, nextBooking: next ?? null, minutesLeft: null };
  }

  return { status: "open", booking: null, nextBooking: next ?? null, minutesLeft: null };
}

function timeToMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const STATUS_COLORS = {
  open: { bg: "#f5f5f5", border: "#d4d4d4", text: "#737373" },       // white/grey — empty
  reserved: { bg: "#16a34a", border: "#16a34a", text: "#ffffff" },    // green — confirmed, not seated
  occupied: { bg: "#2563eb", border: "#2563eb", text: "#ffffff" },    // blue — seated
  turning: { bg: "#d97706", border: "#d97706", text: "#ffffff" },     // amber — nearly done
};

export function FloorLive({ tables, bookings: initialBookings, businessId }: {
  tables: Table[]; bookings: Booking[]; businessId: string;
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [zones] = useState(() => [...new Set(tables.map((t) => t.zone))]);
  const [activeZone, setActiveZone] = useState(zones[0] ?? "Main Dining");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const router = useRouter();

  // Auto-refresh bookings
  const refresh = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/r/${businessId}/bookings?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch { /* silent */ }
  }, [businessId]);

  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const zoneTables = tables.filter((t) => t.zone === activeZone);
  const selectedTable = selectedTableId ? tables.find((t) => t.id === selectedTableId) : null;
  const selectedStatus = selectedTable ? getTableStatus(selectedTable, bookings) : null;

  async function handleAction(action: "seat" | "complete" | "no_show") {
    if (!selectedStatus?.booking) return;
    setActing(true);
    if (action === "seat") await seatBooking(selectedStatus.booking.id, selectedTable?.id);
    if (action === "complete") await completeBooking(selectedStatus.booking.id);
    if (action === "no_show") await noShowBooking(selectedStatus.booking.id);
    await refresh();
    setActing(false);
    router.refresh();
  }

  // Sort bookings for the sidebar
  const todayStr = new Date().toISOString().split("T")[0];
  const todayBookings = bookings.filter(b => b.booking_date === todayStr);
  const sidebarConfirmed = todayBookings.filter(b => b.status === "confirmed").sort((a, b) => a.booking_time.localeCompare(b.booking_time));
  const sidebarSeated = todayBookings.filter(b => b.status === "seated").sort((a, b) => a.booking_time.localeCompare(b.booking_time));
  const sidebarDone = todayBookings.filter(b => b.status === "completed" || b.status === "no_show");

  return (
    <div>
      {/* Mobile: show list instead of map */}
      <div className="md:hidden mb-4 text-xs text-neutral-400 text-center">
        Rotate to landscape or use a larger screen for the floor map.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      {/* Left: Floor map */}
      <div>
      {/* Zone tabs */}
      {zones.length > 1 && (
        <div className="flex items-center gap-1 mb-4 border-b border-neutral-200">
          {zones.map((z) => (
            <button
              key={z}
              onClick={() => { setActiveZone(z); setSelectedTableId(null); }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
                activeZone === z ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div
        className="relative border border-neutral-200 rounded-xl bg-neutral-50 overflow-hidden select-none"
        style={{ aspectRatio: "16 / 10" }}
        onClick={() => setSelectedTableId(null)}
      >
        {/* Grid dots */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle, #999 0.5px, transparent 0.5px)",
          backgroundSize: "5% 8%",
        }} />

        {/* Tables */}
        {zoneTables.map((table) => {
          const { status, booking, minutesLeft } = getTableStatus(table, bookings);
          const colors = STATUS_COLORS[status];
          const isSelected = table.id === selectedTableId;

          return (
            <div
              key={table.id}
              className={`absolute cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-offset-2 ring-white z-20 scale-110" : "z-10 hover:scale-105"
              } ${status === "turning" ? "animate-pulse" : ""}`}
              style={{
                left: `${table.pos_x}%`,
                top: `${table.pos_y}%`,
                width: `${table.width}%`,
                height: `${table.height}%`,
                transform: `translate(-50%, -50%)${isSelected ? " scale(1.1)" : ""}`,
                borderRadius: table.shape === "circle" ? "50%" : "12%",
                background: colors.bg,
                boxShadow: isSelected ? `0 0 0 3px ${colors.border}, 0 4px 12px rgba(0,0,0,0.2)` : "0 2px 4px rgba(0,0,0,0.1)",
              }}
              onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ color: colors.text }}>
                <span className="text-xs font-bold leading-none">{table.name}</span>
                {status === "occupied" && booking?.clients && (
                  <span className="text-[8px] opacity-80 leading-none mt-0.5 truncate max-w-full px-1">
                    {booking.clients.name.split(" ")[0]}
                  </span>
                )}
                {status === "turning" && minutesLeft != null && (
                  <span className="text-[8px] font-bold leading-none mt-0.5">{minutesLeft}m</span>
                )}
                {status === "reserved" && booking && (
                  <span className="text-[8px] opacity-80 leading-none mt-0.5">{formatTime(booking.booking_time)}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty */}
        {zoneTables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-neutral-400">No tables in {activeZone}. Set up tables in Admin.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-neutral-300" style={{ background: STATUS_COLORS.open.bg }} /> Open</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.reserved.bg }} /> Reserved</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.occupied.bg }} /> Seated</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.turning.bg }} /> Turning</span>
      </div>

      {/* Selected table detail */}
      {selectedTable && selectedStatus && (
        <div className="mt-4 border border-neutral-200 rounded-xl bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-base font-bold text-neutral-900">Table {selectedTable.name}</span>
              <span className="text-sm text-neutral-400 ml-2">{selectedTable.capacity} seats · {selectedTable.zone}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{
              background: STATUS_COLORS[selectedStatus.status].bg,
              color: STATUS_COLORS[selectedStatus.status].text,
              border: selectedStatus.status === "open" ? "1px solid #d4d4d4" : "none",
            }}>
              {selectedStatus.status === "reserved" ? "reserved" : selectedStatus.status}
            </span>
          </div>

          {selectedStatus.booking && (
            <div className="mb-3 pb-3 border-b border-neutral-100">
              <div className="text-sm font-semibold text-neutral-900">{selectedStatus.booking.clients?.name ?? "Guest"}</div>
              <div className="text-sm text-neutral-500">
                Party of {selectedStatus.booking.party_size} · {formatTime(selectedStatus.booking.booking_time)}
                {selectedStatus.booking.clients?.phone && ` · ${selectedStatus.booking.clients.phone}`}
              </div>
              {selectedStatus.booking.notes && (
                <div className="text-sm text-neutral-400 mt-1">{selectedStatus.booking.notes}</div>
              )}
            </div>
          )}

          {selectedStatus.nextBooking && selectedStatus.nextBooking.id !== selectedStatus.booking?.id && (
            <div className="mb-3 text-xs text-neutral-400">
              Next: {selectedStatus.nextBooking.clients?.name ?? "Guest"} at {formatTime(selectedStatus.nextBooking.booking_time)} ({selectedStatus.nextBooking.party_size}p)
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {selectedStatus.booking?.status === "confirmed" && (
              <button onClick={() => handleAction("seat")} disabled={acting}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-bold hover:bg-blue-500 disabled:opacity-40 transition-colors">
                Seat
              </button>
            )}
            {(selectedStatus.booking?.status === "seated") && (
              <button onClick={() => handleAction("complete")} disabled={acting}
                className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-bold hover:bg-emerald-500 disabled:opacity-40 transition-colors">
                Done
              </button>
            )}
            {selectedStatus.booking && selectedStatus.booking.status !== "completed" && (
              <button onClick={() => handleAction("no_show")} disabled={acting}
                className="rounded-lg border border-neutral-200 text-neutral-600 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40 transition-colors">
                No-show
              </button>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Right: Today's service list */}
      <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden hidden lg:block">
        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
          <span className="text-sm font-bold text-neutral-900">Today's Service</span>
          <span className="text-xs text-neutral-400 ml-2">
            {todayBookings.filter(b => b.status !== "cancelled").length} reservations · {todayBookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.party_size, 0)} covers
          </span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
          {/* Arriving */}
          {sidebarConfirmed.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/50">
                Arriving ({sidebarConfirmed.length})
              </div>
              {sidebarConfirmed.map(b => {
                const tbl = tables.find(t => t.id === b.table_id);
                return (
                  <div key={b.id}
                    className={`px-4 py-2.5 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors ${
                      selectedTableId === b.table_id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => { if (b.table_id) setSelectedTableId(b.table_id); }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-900">{b.clients?.name ?? "Guest"}</span>
                      <span className="text-xs tabular-nums text-neutral-500">{formatTime(b.booking_time)}</span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {b.party_size}p{tbl ? ` · ${tbl.name}` : " · no table"}{b.source === "walk_in" ? " · walk-in" : b.source === "waitlist" ? " · waitlist" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Seated */}
          {sidebarSeated.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50/50">
                Seated ({sidebarSeated.length})
              </div>
              {sidebarSeated.map(b => {
                const tbl = tables.find(t => t.id === b.table_id);
                const bMins = timeToMins(b.booking_time);
                const bEnd = bMins + (b.duration_minutes || 90);
                const now2 = new Date();
                const nowM = now2.getHours() * 60 + now2.getMinutes();
                const left = bEnd - nowM;
                return (
                  <div key={b.id}
                    className={`px-4 py-2.5 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors ${
                      selectedTableId === b.table_id ? "bg-blue-50" : ""
                    } ${left <= 15 ? "bg-amber-50" : ""}`}
                    onClick={() => { if (b.table_id) setSelectedTableId(b.table_id); }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-900">{b.clients?.name ?? "Guest"}</span>
                      <span className={`text-xs tabular-nums font-bold ${left <= 15 ? "text-amber-700" : "text-blue-600"}`}>
                        {left > 0 ? `${left}m` : "Over"}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {b.party_size}p{tbl ? ` · ${tbl.name}` : ""} · seated {formatTime(b.booking_time)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Done */}
          {sidebarDone.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[10px] font-bold text-neutral-300 uppercase tracking-wider">
                Done ({sidebarDone.length})
              </div>
              {sidebarDone.map(b => (
                <div key={b.id} className="px-4 py-2 border-b border-neutral-50 text-neutral-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{b.clients?.name ?? "Guest"}</span>
                    <span className="text-xs tabular-nums">{formatTime(b.booking_time)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {todayBookings.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-neutral-400">
              No reservations today.
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
