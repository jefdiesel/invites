"use client";

import { useState } from "react";
import {
  seatBooking, completeBooking, noShowBooking, cancelBooking,
  addToWaitlist, seatFromWaitlist, removeFromWaitlist, createWalkIn,
  assignTable,
} from "@/lib/restaurant-actions";
import { TablePicker } from "./table-picker";

type Booking = {
  id: string; booking_date: string; booking_time: string; party_size: number;
  status: string; notes: string; table_id: string | null; duration_minutes: number | null;
  clients?: { name: string; email: string; phone: string };
};

type Table = {
  id: string; name: string; zone: string; capacity: number;
  is_active: boolean; sort_order: number;
};

type WaitlistEntry = {
  id: string; name: string; phone: string; party_size: number;
  notes: string; status: string; quoted_wait_minutes: number; created_at: string;
};

export function ManageView({ businessId, businessName, slug, bookings, tables, slotDuration, waitlist: initialWaitlist, upcomingBookings }: {
  businessId: string; businessName: string; slug: string;
  bookings: Booking[]; tables: Table[]; slotDuration: number;
  waitlist: WaitlistEntry[];
  upcomingBookings: Booking[];
}) {
  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter(b => b.booking_date === today);
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const activeTables = tables.filter(t => t.is_active).sort((a, b) => a.sort_order - b.sort_order);

  const arriving = todaysBookings.filter(b => b.status === "confirmed").sort((a, b) => toMins(a.booking_time) - toMins(b.booking_time));
  const seated = todaysBookings.filter(b => b.status === "seated").sort((a, b) => toMins(a.booking_time) - toMins(b.booking_time));
  const completed = todaysBookings.filter(b => b.status === "completed" || b.status === "no_show");
  const todayCovers = todaysBookings.filter(b => b.status !== "cancelled" && b.status !== "no_show")
    .reduce((s, b) => s + b.party_size, 0);

  // Waitlist add form
  const [showAdd, setShowAdd] = useState<"waitlist" | "walkin" | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", party_size: "2", notes: "", wait: "30", tableId: "" });
  // Seating flow — pick table before seating
  const [seatPickId, setSeatPickId] = useState<string | null>(null); // booking id needing table pick
  const [seatPickTable, setSeatPickTable] = useState("");
  const [seatWaitlistId, setSeatWaitlistId] = useState<string | null>(null);
  const [seatWaitlistTable, setSeatWaitlistTable] = useState("");

  async function handleAction(action: string, bookingId: string, tableId?: string) {
    if (action === "seat") await seatBooking(bookingId, tableId);
    else if (action === "complete") await completeBooking(bookingId);
    else if (action === "noshow") await noShowBooking(bookingId);
    else if (action === "cancel") await cancelBooking(bookingId);
    location.reload();
  }

  async function handleSeatWithTable(bookingId: string) {
    await seatBooking(bookingId, seatPickTable || undefined);
    setSeatPickId(null);
    setSeatPickTable("");
    location.reload();
  }

  async function handleSeatWaitlistWithTable(entryId: string) {
    await seatFromWaitlist(entryId, seatWaitlistTable || undefined);
    setSeatWaitlistId(null);
    setSeatWaitlistTable("");
    location.reload();
  }

  async function handleAddWaitlist() {
    if (!form.name.trim()) return;
    await addToWaitlist(businessId, {
      name: form.name, phone: form.phone,
      party_size: parseInt(form.party_size) || 2,
      notes: form.notes,
      quoted_wait_minutes: parseInt(form.wait) || 30,
    });
    resetForm();
    location.reload();
  }

  async function handleWalkIn() {
    if (!form.name.trim()) return;
    await createWalkIn(businessId, {
      name: form.name, phone: form.phone,
      party_size: parseInt(form.party_size) || 2,
      notes: form.notes, tableId: form.tableId || null,
    });
    resetForm();
    location.reload();
  }

  async function handleSeatWaitlist(id: string) {
    await seatFromWaitlist(id);
    location.reload();
  }

  async function handleRemoveWaitlist(id: string) {
    await removeFromWaitlist(id);
    location.reload();
  }

  function resetForm() {
    setForm({ name: "", phone: "", party_size: "2", notes: "", wait: "30", tableId: "" });
    setShowAdd(null);
  }

  function minutesAgo(created: string) {
    const mins = Math.floor((Date.now() - new Date(created).getTime()) / 60000);
    if (mins < 1) return "just now";
    return `${mins}m`;
  }

  const inputClass = "border border-neutral-200 rounded-lg px-3 py-2.5 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-neutral-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold tabular-nums">{todaysBookings.filter(b => b.status !== "cancelled").length}</div>
          <div className="text-sm text-neutral-500">Reservations</div>
        </div>
        <div className="bg-neutral-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold tabular-nums">{todayCovers}</div>
          <div className="text-sm text-neutral-500">Covers</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold tabular-nums text-emerald-700">{activeTables.filter(t => {
            const tb = todaysBookings.filter(b => b.table_id === t.id && b.status === "seated");
            return tb.length === 0;
          }).length}</div>
          <div className="text-sm text-emerald-600">Open</div>
        </div>
        <div className="bg-rose-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold tabular-nums text-rose-700">{seated.length}</div>
          <div className="text-sm text-rose-600">Seated</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold tabular-nums text-blue-700">{initialWaitlist.length}</div>
          <div className="text-sm text-blue-600">Waitlist</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <div>
      {/* Add buttons */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setShowAdd(showAdd === "waitlist" ? null : "waitlist")}
          className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-colors ${showAdd === "waitlist" ? "bg-neutral-200 text-neutral-700" : "bg-neutral-900 text-white hover:bg-neutral-700"}`}>
          + Waitlist
        </button>
        <button onClick={() => setShowAdd(showAdd === "walkin" ? null : "walkin")}
          className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-colors ${showAdd === "walkin" ? "bg-neutral-200 text-neutral-700" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
          + Walk-in
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="border border-neutral-200 rounded-lg p-4 mb-6 bg-neutral-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} autoFocus />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            <select value={form.party_size} onChange={e => setForm({ ...form, party_size: e.target.value })} className={inputClass}>
              {[1,2,3,4,5,6,7,8,10,12].map(n => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
            </select>
            {showAdd === "waitlist" && (
              <select value={form.wait} onChange={e => setForm({ ...form, wait: e.target.value })} className={inputClass}>
                {[10,15,20,30,45,60,90].map(n => <option key={n} value={n}>~{n} min</option>)}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`${inputClass} flex-1`} />
            {showAdd === "walkin" && (
              <TablePicker tables={activeTables} bookings={todaysBookings}
                partySize={parseInt(form.party_size) || 2} currentTableId={form.tableId || null}
                onSelect={tid => setForm({ ...form, tableId: tid })} compact />
            )}
            <button onClick={showAdd === "walkin" ? handleWalkIn : handleAddWaitlist}
              className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 transition-colors whitespace-nowrap">
              {showAdd === "walkin" ? "Seat Now" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* ── Waitlist ── */}
      {initialWaitlist.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-3">
            Waitlist ({initialWaitlist.length})
          </h3>
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50 border-b border-neutral-200">
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600 w-8">#</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Name</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-neutral-600">Party</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Wait</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Waiting</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Notes</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-neutral-600"></th>
                </tr>
              </thead>
              <tbody>
                {initialWaitlist.map((entry, i) => (
                  <tr key={entry.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-bold text-neutral-300">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900">{entry.name}</div>
                      {entry.phone && <div className="text-xs text-neutral-400">{entry.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{entry.party_size}</td>
                    <td className="px-4 py-3 text-neutral-500">~{entry.quoted_wait_minutes}m</td>
                    <td className="px-4 py-3 tabular-nums text-neutral-500">{minutesAgo(entry.created_at)}</td>
                    <td className="px-4 py-3 text-neutral-500 max-w-[200px] truncate">{entry.notes || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {seatWaitlistId === entry.id ? (
                        <div className="flex items-center gap-1">
                          <TablePicker tables={activeTables} bookings={todaysBookings}
                            partySize={entry.party_size} currentTableId={null}
                            onSelect={tid => setSeatWaitlistTable(tid)} compact />
                          <button onClick={() => handleSeatWaitlistWithTable(entry.id)}
                            className="px-2 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors">
                            Go
                          </button>
                          <button onClick={() => setSeatWaitlistId(null)} className="text-xs text-neutral-400">x</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSeatWaitlistId(entry.id)}
                            className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors">
                            Seat
                          </button>
                          <button onClick={() => handleRemoveWaitlist(entry.id)}
                            className="px-2 py-1.5 text-xs font-medium text-neutral-400 hover:text-rose-600 transition-colors">
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Arriving ── */}
      {arriving.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-3">
            Arriving ({arriving.length})
          </h3>
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Time</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Guest</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-neutral-600">Party</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Table</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Notes</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-neutral-600"></th>
                </tr>
              </thead>
              <tbody>
                {arriving.map(b => {
                  const tableName = activeTables.find(t => t.id === b.table_id)?.name;
                  return (
                    <tr key={b.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-3 tabular-nums font-bold text-neutral-900">{fmtTime(b.booking_time)}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900">{b.clients?.name ?? "—"}</div>
                        {b.clients?.phone && <div className="text-xs text-neutral-400">{b.clients.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{b.party_size}</td>
                      <td className="px-4 py-3">
                        <TablePicker tables={activeTables} bookings={todaysBookings}
                          partySize={b.party_size} currentTableId={b.table_id}
                          onSelect={async (tid) => { await assignTable(b.id, tid); location.reload(); }} compact />
                      </td>
                      <td className="px-4 py-3 text-neutral-500 max-w-[200px] truncate">{b.notes || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {seatPickId === b.id ? (
                          <div className="flex items-center gap-1">
                            <TablePicker tables={activeTables} bookings={todaysBookings}
                              partySize={b.party_size} currentTableId={b.table_id}
                              onSelect={tid => setSeatPickTable(tid)} compact />
                            <button onClick={() => handleSeatWithTable(b.id)}
                              className="px-2 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors">
                              Go
                            </button>
                            <button onClick={() => setSeatPickId(null)} className="text-xs text-neutral-400">x</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => b.table_id ? handleAction("seat", b.id, b.table_id) : setSeatPickId(b.id)}
                              className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors">
                              Seat
                            </button>
                            <button onClick={() => handleAction("noshow", b.id)}
                              className="px-2 py-1.5 text-xs font-medium text-neutral-400 hover:text-amber-600 transition-colors">
                              No-show
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Seated ── */}
      {seated.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-3">
            Seated ({seated.length})
          </h3>
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Time Left</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Guest</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-neutral-600">Party</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Table</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Seated</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Notes</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-neutral-600"></th>
                </tr>
              </thead>
              <tbody>
                {seated.map(b => {
                  const end = toMins(b.booking_time) + (b.duration_minutes || slotDuration);
                  const minsLeft = end - nowMins;
                  const tableName = activeTables.find(t => t.id === b.table_id)?.name;
                  const turning = minsLeft <= 15;
                  return (
                    <tr key={b.id} className={`border-b border-neutral-100 ${turning ? "bg-amber-50" : "hover:bg-neutral-50"}`}>
                      <td className={`px-4 py-3 tabular-nums font-bold ${turning ? "text-amber-700" : "text-neutral-900"}`}>
                        {minsLeft > 0 ? `${minsLeft}m` : "Over"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900">{b.clients?.name ?? "—"}</div>
                        {b.clients?.phone && <div className="text-xs text-neutral-400">{b.clients.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{b.party_size}</td>
                      <td className="px-4 py-3 text-neutral-600">{tableName ?? "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-neutral-500">{fmtTime(b.booking_time)}</td>
                      <td className="px-4 py-3 text-neutral-500 max-w-[200px] truncate">{b.notes || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleAction("complete", b.id)}
                          className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors">
                          Done
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Completed ── */}
      {completed.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-3">
            Done ({completed.length})
          </h3>
          <div className="border border-neutral-100 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {completed.map(b => {
                  const tableName = activeTables.find(t => t.id === b.table_id)?.name;
                  return (
                    <tr key={b.id} className="border-b border-neutral-50 text-neutral-400">
                      <td className="px-4 py-2 tabular-nums">{fmtTime(b.booking_time)}</td>
                      <td className="px-4 py-2">{b.clients?.name ?? "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{b.party_size}</td>
                      <td className="px-4 py-2">{tableName ?? "—"}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs font-medium ${b.status === "no_show" ? "text-amber-500" : "text-neutral-300"}`}>
                          {b.status === "no_show" ? "no-show" : "done"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {arriving.length === 0 && seated.length === 0 && initialWaitlist.length === 0 && (
        <p className="text-neutral-400 text-center py-12">No active reservations or waitlist entries.</p>
      )}
      </div>

      {/* ── Right sidebar: Today's service + upcoming ── */}
      <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden hidden lg:block">
        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
          <div className="text-sm font-bold text-neutral-900">Today's Service</div>
          <div className="text-xs text-neutral-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            {todaysBookings.filter(b => b.status !== "cancelled").length > 0 && (
              <> · {todaysBookings.filter(b => b.status !== "cancelled").length} res · {todayCovers} covers</>
            )}
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          {/* Arriving */}
          {arriving.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50/50">
                Arriving ({arriving.length})
              </div>
              {arriving.map(b => {
                const tbl = activeTables.find(t => t.id === b.table_id);
                return (
                  <div key={b.id} className="px-4 py-2.5 border-b border-neutral-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-900">{b.clients?.name ?? "Guest"}</span>
                      <span className="text-xs tabular-nums text-neutral-500">{fmtTime(b.booking_time)}</span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {b.party_size}p{tbl ? ` · ${tbl.name}` : " · no table"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Seated */}
          {seated.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50/50">
                Seated ({seated.length})
              </div>
              {seated.map(b => {
                const tbl = activeTables.find(t => t.id === b.table_id);
                const end = toMins(b.booking_time) + (b.duration_minutes || slotDuration);
                const left = end - nowMins;
                return (
                  <div key={b.id} className={`px-4 py-2.5 border-b border-neutral-100 ${left <= 15 ? "bg-amber-50" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-900">{b.clients?.name ?? "Guest"}</span>
                      <span className={`text-xs tabular-nums font-bold ${left <= 15 ? "text-amber-700" : "text-blue-600"}`}>
                        {left > 0 ? `${left}m` : "Over"}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {b.party_size}p{tbl ? ` · ${tbl.name}` : ""} · seated {fmtTime(b.booking_time)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Done */}
          {completed.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[10px] font-bold text-neutral-300 uppercase tracking-wider">
                Done ({completed.length})
              </div>
              {completed.map(b => (
                <div key={b.id} className="px-4 py-1.5 border-b border-neutral-50 text-neutral-300">
                  <span className="text-xs">{b.clients?.name ?? "Guest"} · {fmtTime(b.booking_time)} · {b.party_size}p</span>
                </div>
              ))}
            </div>
          )}

          {/* Empty today — show upcoming */}
          {arriving.length === 0 && seated.length === 0 && completed.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-neutral-400 mb-1">No reservations today.</p>
            </div>
          )}

          {/* Upcoming reservations (next days) */}
          {(() => {
            const futureBookings = upcomingBookings
              .filter(b => b.booking_date > today && b.status === "confirmed")
              .sort((a, b) => a.booking_date.localeCompare(b.booking_date) || a.booking_time.localeCompare(b.booking_time));

            if (futureBookings.length === 0) return null;

            // Group by date
            const byDate = new Map<string, Booking[]>();
            for (const b of futureBookings) {
              const arr = byDate.get(b.booking_date) || [];
              arr.push(b);
              byDate.set(b.booking_date, arr);
            }

            return (
              <div>
                <div className="px-4 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-50 border-t border-neutral-200">
                  Coming Up
                </div>
                {[...byDate.entries()].map(([date, dBookings]) => (
                  <div key={date}>
                    <div className="px-4 py-1.5 text-xs font-bold text-neutral-500 bg-neutral-50/50 border-b border-neutral-100">
                      {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      <span className="text-neutral-300 font-normal ml-1">· {dBookings.length} res · {dBookings.reduce((s, b) => s + b.party_size, 0)} covers</span>
                    </div>
                    {dBookings.map(b => (
                      <div key={b.id} className="px-4 py-2 border-b border-neutral-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-700">{b.clients?.name ?? "Guest"}</span>
                          <span className="text-xs tabular-nums text-neutral-400">{fmtTime(b.booking_time)}</span>
                        </div>
                        <div className="text-xs text-neutral-300">{b.party_size}p</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
      </div>
    </div>
  );
}

function toMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function fmtTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
