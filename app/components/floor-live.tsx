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

type WaitlistEntry = {
  id: string; name: string; phone: string; party_size: number;
  notes: string; quoted_wait_minutes: number; created_at: string;
};

export function FloorLive({ tables, bookings: initialBookings, businessId, waitlist }: {
  tables: Table[]; bookings: Booking[]; businessId: string;
  waitlist?: WaitlistEntry[];
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [zones] = useState(() => [...new Set(tables.map((t) => t.zone))]);
  const [activeZone, setActiveZone] = useState(zones[0] ?? "Main Dining");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [dragging, setDragging] = useState(false);
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

  // Build unified service list: reservations + waitlist, reservations first within same time
  const todayStr = new Date().toISOString().split("T")[0];
  const todayBookings = bookings.filter(b => b.booking_date === todayStr);

  type ServiceItem = {
    type: "reservation" | "waitlist";
    id: string;
    name: string;
    partySize: number;
    time: string; // booking_time or created_at time
    status: string;
    tableId: string | null;
    phone?: string;
    notes?: string;
    source?: string;
    durationMins?: number | null;
    quotedWait?: number;
    createdAt?: string;
  };

  const serviceItems: ServiceItem[] = [];

  // Add active bookings
  for (const b of todayBookings.filter(b => b.status === "confirmed" || b.status === "seated")) {
    serviceItems.push({
      type: "reservation", id: b.id, name: b.clients?.name ?? "Guest",
      partySize: b.party_size, time: b.booking_time, status: b.status,
      tableId: b.table_id, phone: b.clients?.phone, notes: b.notes,
      source: b.source, durationMins: b.duration_minutes,
    });
  }

  // Add waitlist entries
  for (const w of (waitlist ?? [])) {
    const created = new Date(w.created_at);
    const wTime = `${created.getHours().toString().padStart(2, "0")}:${created.getMinutes().toString().padStart(2, "0")}`;
    serviceItems.push({
      type: "waitlist", id: w.id, name: w.name, partySize: w.party_size,
      time: wTime, status: "waiting", tableId: null, phone: w.phone,
      notes: w.notes, quotedWait: w.quoted_wait_minutes, createdAt: w.created_at,
    });
  }

  // Sort: by time, reservations before waitlist at same time
  serviceItems.sort((a, b) => {
    const timeCmp = a.time.localeCompare(b.time);
    if (timeCmp !== 0) return timeCmp;
    if (a.type === "reservation" && b.type === "waitlist") return -1;
    if (a.type === "waitlist" && b.type === "reservation") return 1;
    return 0;
  });

  const doneBookings = todayBookings.filter(b => b.status === "completed" || b.status === "no_show");
  const activeCount = serviceItems.length;
  const totalCovers = serviceItems.reduce((s, i) => s + i.partySize, 0);

  // Drag handler for resizable sidebar
  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startW = sidebarWidth;
    function onMove(ev: MouseEvent) {
      const diff = startX - ev.clientX;
      const container = document.querySelector("[data-floor-container]");
      const maxW = (container?.clientWidth ?? 1200) - 40;
      setSidebarWidth(Math.max(40, Math.min(maxW, startW + diff)));
    }
    function onUp() {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div>
      {/* Mobile: show list instead of map */}
      <div className="md:hidden mb-4 text-xs text-neutral-400 text-center">
        Rotate to landscape or use a larger screen for the floor map.
      </div>

      <div className="flex gap-0" data-floor-container style={{ userSelect: dragging ? "none" : "auto" }}>
      {/* Left: Floor map — clips content, doesn't shrink tables */}
      <div className="flex-1 pr-2 overflow-hidden" style={{ minWidth: 0 }}>
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
        style={{ minWidth: 500, aspectRatio: "16 / 10" }}
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

      {/* Drag handle */}
      <div onMouseDown={handleMouseDown}
        className="w-2 cursor-col-resize flex items-center justify-center shrink-0 hidden lg:flex hover:bg-neutral-200 rounded transition-colors"
        style={{ background: dragging ? "#e5e5e5" : "transparent" }}>
        <div className="w-0.5 h-8 bg-neutral-300 rounded-full" />
      </div>

      {/* Right: Service list */}
      <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden flex flex-col shrink-0"
        style={{ width: sidebarWidth }}>
        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
          <div className="text-sm font-bold text-neutral-900">Service</div>
          <div className="text-xs text-neutral-400">
            {activeCount > 0 ? `${activeCount} active · ${totalCovers} covers` : "No activity"}
          </div>
        </div>
        <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(100vh - 220px)" }}>
          {/* Unified list: reservations + waitlist ordered by time */}
          {serviceItems.length > 0 && (
            <div>
              {serviceItems.map(item => {
                const tbl = item.tableId ? tables.find(t => t.id === item.tableId) : null;
                const isRes = item.type === "reservation";
                const isSeated = item.status === "seated";
                const nowMins2 = new Date().getHours() * 60 + new Date().getMinutes();

                // Time left for seated
                let timeLeft = 0;
                if (isSeated) {
                  const end = timeToMins(item.time) + (item.durationMins || 90);
                  timeLeft = end - nowMins2;
                }
                const turning = isSeated && timeLeft <= 15;

                // Waitlist: minutes waiting
                let waitingMins = 0;
                if (!isRes && item.createdAt) {
                  waitingMins = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000);
                }

                return (
                  <div key={`${item.type}-${item.id}`}
                    className={`px-4 py-2.5 border-b border-neutral-100 cursor-pointer transition-colors ${
                      selectedTableId && selectedTableId === item.tableId ? "bg-blue-50" : ""
                    } ${turning ? "bg-amber-50" : "hover:bg-neutral-50"}`}
                    onClick={() => { if (item.tableId) setSelectedTableId(item.tableId); }}>
                    <div className="flex items-center gap-2">
                      {/* Type indicator */}
                      {isRes ? (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isSeated ? "bg-blue-500" : "bg-emerald-500"
                        }`} />
                      ) : (
                        <span className="text-[10px] font-bold text-blue-500 shrink-0 w-1.5">W</span>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm truncate ${isRes ? "font-bold text-neutral-900" : "font-medium text-neutral-600"}`}>
                            {item.name}
                          </span>
                          <span className={`text-xs tabular-nums shrink-0 ml-2 ${
                            turning ? "font-bold text-amber-700" :
                            isSeated ? "font-bold text-blue-600" :
                            "text-neutral-400"
                          }`}>
                            {isSeated ? (timeLeft > 0 ? `${timeLeft}m` : "Over") :
                             !isRes ? `${waitingMins}m wait` :
                             formatTime(item.time)}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                          <span>{item.partySize}p</span>
                          {tbl && <span>· {tbl.name}</span>}
                          {!isRes && <span className="text-blue-400 font-medium">· waitlist</span>}
                          {isRes && item.source === "walk_in" && <span>· walk-in</span>}
                          {isRes && !isSeated && <span>· {formatTime(item.time)}</span>}
                          {isSeated && <span>· seated {formatTime(item.time)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Done */}
          {doneBookings.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[10px] font-bold text-neutral-300 uppercase tracking-wider border-t border-neutral-100">
                Done ({doneBookings.length})
              </div>
              {doneBookings.map(b => (
                <div key={b.id} className="px-4 py-1.5 border-b border-neutral-50 text-neutral-300">
                  <span className="text-xs">{b.clients?.name ?? "Guest"} · {formatTime(b.booking_time)} · {b.party_size}p</span>
                </div>
              ))}
            </div>
          )}

          {serviceItems.length === 0 && doneBookings.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-neutral-400">
              No reservations or waitlist today.
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
