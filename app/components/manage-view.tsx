"use client";

import { useState } from "react";
import {
  seatBooking, completeBooking, noShowBooking, cancelBooking,
  addToWaitlist, seatFromWaitlist, removeFromWaitlist, createWalkIn,
} from "@/lib/restaurant-actions";

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

export function ManageView({ businessId, businessName, slug, bookings, tables, slotDuration, waitlist: initialWaitlist }: {
  businessId: string; businessName: string; slug: string;
  bookings: Booking[]; tables: Table[]; slotDuration: number;
  waitlist: WaitlistEntry[];
}) {
  const [view, setView] = useState<"floor" | "list" | "waitlist">("floor");

  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter(b => b.booking_date === today);
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const activeTables = tables.filter(t => t.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const zones = [...new Set(activeTables.map(t => t.zone || "Main"))];

  const confirmed = todaysBookings.filter(b => b.status === "confirmed");
  const seated = todaysBookings.filter(b => b.status === "seated");
  const todayCovers = todaysBookings.filter(b => b.status !== "cancelled" && b.status !== "no_show")
    .reduce((s, b) => s + b.party_size, 0);

  function getTableState(table: Table) {
    const tableBookings = todaysBookings.filter(b =>
      b.table_id === table.id && (b.status === "confirmed" || b.status === "seated")
    ).sort((a, b) => toMins(a.booking_time) - toMins(b.booking_time));

    const current = tableBookings.find(b => {
      const start = toMins(b.booking_time);
      const end = start + (b.duration_minutes || slotDuration);
      return nowMins >= start && nowMins < end;
    });

    const next = tableBookings.find(b => toMins(b.booking_time) > nowMins);

    if (current) {
      const end = toMins(current.booking_time) + (current.duration_minutes || slotDuration);
      const minsLeft = end - nowMins;
      return { status: minsLeft <= 15 ? "turning" as const : "occupied" as const, booking: current, minsLeft, next };
    }

    if (next) {
      const minsUntil = toMins(next.booking_time) - nowMins;
      if (minsUntil <= 30) return { status: "upcoming" as const, booking: null, minsLeft: 0, next };
    }

    return { status: "open" as const, booking: null, minsLeft: 0, next: next ?? null };
  }

  async function handleAction(action: string, bookingId: string) {
    if (action === "seat") await seatBooking(bookingId);
    else if (action === "complete") await completeBooking(bookingId);
    else if (action === "noshow") await noShowBooking(bookingId);
    else if (action === "cancel") await cancelBooking(bookingId);
    location.reload();
  }

  return (
    <div>
      {/* Stats bar — big for iPad */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-neutral-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold tabular-nums">{todaysBookings.filter(b => b.status !== "cancelled").length}</div>
          <div className="text-sm text-neutral-500">Reservations</div>
        </div>
        <div className="bg-neutral-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold tabular-nums">{todayCovers}</div>
          <div className="text-sm text-neutral-500">Covers</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold tabular-nums text-emerald-700">{activeTables.filter(t => getTableState(t).status === "open").length}</div>
          <div className="text-sm text-emerald-600">Open Tables</div>
        </div>
        <div className="bg-rose-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold tabular-nums text-rose-700">{seated.length}</div>
          <div className="text-sm text-rose-600">Seated Now</div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setView("floor")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === "floor" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>
          Floor Map
        </button>
        <button onClick={() => setView("list")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === "list" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>
          Reservations
        </button>
        <button onClick={() => setView("waitlist")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === "waitlist" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>
          Waitlist{initialWaitlist.length > 0 ? ` (${initialWaitlist.length})` : ""}
        </button>
      </div>

      {view === "floor" && (
        /* Floor Map — big touch targets for iPad */
        <div>
          {zones.map(zone => {
            const zoneTables = activeTables.filter(t => (t.zone || "Main") === zone);
            return (
              <div key={zone} className="mb-8">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">{zone}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {zoneTables.map(table => {
                    const state = getTableState(table);
                    const bg = {
                      open: "bg-emerald-50 border-emerald-200",
                      occupied: "bg-rose-50 border-rose-200",
                      turning: "bg-amber-50 border-amber-300 animate-pulse",
                      upcoming: "bg-blue-50 border-blue-200",
                    }[state.status];
                    const textColor = {
                      open: "text-emerald-800",
                      occupied: "text-rose-800",
                      turning: "text-amber-800",
                      upcoming: "text-blue-800",
                    }[state.status];

                    return (
                      <div key={table.id} className={`border-2 rounded-xl p-4 ${bg}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className={`text-lg font-bold ${textColor}`}>{table.name}</div>
                            <div className="text-xs text-neutral-500">{table.capacity} seats</div>
                          </div>
                          <div className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                            state.status === "open" ? "bg-emerald-200 text-emerald-800" :
                            state.status === "occupied" ? "bg-rose-200 text-rose-800" :
                            state.status === "turning" ? "bg-amber-200 text-amber-800" :
                            "bg-blue-200 text-blue-800"
                          }`}>
                            {state.status === "open" ? "Open" :
                             state.status === "occupied" ? `${state.minsLeft}m` :
                             state.status === "turning" ? `${state.minsLeft}m!` :
                             "Soon"}
                          </div>
                        </div>

                        {state.booking && (
                          <div className="mb-3">
                            <div className="text-sm font-semibold text-neutral-900">{state.booking.clients?.name}</div>
                            <div className="text-xs text-neutral-500">{state.booking.party_size}p · {fmtTime(state.booking.booking_time)}</div>
                            {state.booking.notes && <div className="text-xs text-neutral-400 mt-1 truncate">{state.booking.notes}</div>}
                          </div>
                        )}

                        {/* Actions — big touch targets */}
                        {state.booking && (
                          <div className="flex gap-2">
                            {state.booking.status === "confirmed" && (
                              <button onClick={() => handleAction("seat", state.booking!.id)}
                                className="flex-1 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg active:bg-emerald-700">
                                Seat
                              </button>
                            )}
                            {state.booking.status === "seated" && (
                              <button onClick={() => handleAction("complete", state.booking!.id)}
                                className="flex-1 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg active:bg-blue-700">
                                Done
                              </button>
                            )}
                            <button onClick={() => handleAction("noshow", state.booking!.id)}
                              className="px-3 py-2 text-xs font-medium text-amber-700 bg-amber-100 rounded-lg active:bg-amber-200">
                              NS
                            </button>
                          </div>
                        )}

                        {!state.booking && state.next && (
                          <div className="text-xs text-neutral-500">
                            Next: {state.next.clients?.name} · {fmtTime(state.next.booking_time)} · {state.next.party_size}p
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex gap-4 text-xs text-neutral-500 mt-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300" /> Open</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-200 border border-rose-300" /> Occupied</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-300" /> Turning</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-200 border border-blue-300" /> Upcoming</span>
          </div>
        </div>
      )}
      {view === "list" && (
        /* Reservation List */
        <div>
          {/* Upcoming confirmed — need action */}
          {confirmed.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-3">
                Arriving ({confirmed.length})
              </h3>
              <div className="space-y-2">
                {confirmed.sort((a, b) => toMins(a.booking_time) - toMins(b.booking_time)).map(b => (
                  <div key={b.id} className="flex items-center justify-between border border-neutral-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold tabular-nums text-neutral-900 w-16">{fmtTime(b.booking_time)}</div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{b.clients?.name}</div>
                        <div className="text-xs text-neutral-500">{b.party_size} guests{b.notes ? ` · ${b.notes}` : ""}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction("seat", b.id)}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg active:bg-emerald-700">
                        Seat
                      </button>
                      <button onClick={() => handleAction("noshow", b.id)}
                        className="px-3 py-2.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-lg active:bg-amber-200">
                        No-show
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Currently seated */}
          {seated.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-3">
                Seated ({seated.length})
              </h3>
              <div className="space-y-2">
                {seated.map(b => {
                  const end = toMins(b.booking_time) + (b.duration_minutes || slotDuration);
                  const minsLeft = end - nowMins;
                  const tableName = activeTables.find(t => t.id === b.table_id)?.name;
                  return (
                    <div key={b.id} className={`flex items-center justify-between border rounded-xl px-4 py-3 ${
                      minsLeft <= 15 ? "border-amber-300 bg-amber-50" : "border-neutral-200"
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`text-lg font-bold tabular-nums w-16 ${minsLeft <= 15 ? "text-amber-700" : "text-neutral-900"}`}>
                          {minsLeft > 0 ? `${minsLeft}m` : "Over"}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-neutral-900">
                            {b.clients?.name}
                            {tableName && <span className="text-neutral-400 font-normal ml-2">@ {tableName}</span>}
                          </div>
                          <div className="text-xs text-neutral-500">{b.party_size} guests · seated {fmtTime(b.booking_time)}</div>
                        </div>
                      </div>
                      <button onClick={() => handleAction("complete", b.id)}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg active:bg-blue-700">
                        Done
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {confirmed.length === 0 && seated.length === 0 && (
            <p className="text-neutral-400 text-center py-12">No active reservations right now.</p>
          )}
        </div>
      )}
      {view === "waitlist" && (
        <WaitlistView
          businessId={businessId}
          waitlist={initialWaitlist}
          tables={activeTables}
        />
      )}
    </div>
  );
}

function WaitlistView({ businessId, waitlist, tables }: {
  businessId: string; waitlist: WaitlistEntry[]; tables: Table[];
}) {
  const [adding, setAdding] = useState(false);
  const [walkIn, setWalkIn] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", party_size: "2", notes: "", wait: "30" });

  const inputClass = "border border-neutral-200 rounded-lg px-3 py-2.5 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  async function handleAddWaitlist() {
    if (!form.name.trim()) return;
    await addToWaitlist(businessId, {
      name: form.name, phone: form.phone,
      party_size: parseInt(form.party_size) || 2,
      notes: form.notes,
      quoted_wait_minutes: parseInt(form.wait) || 30,
    });
    setForm({ name: "", phone: "", party_size: "2", notes: "", wait: "30" });
    setAdding(false);
    location.reload();
  }

  async function handleWalkIn() {
    if (!form.name.trim()) return;
    await createWalkIn(businessId, {
      name: form.name, phone: form.phone,
      party_size: parseInt(form.party_size) || 2,
      notes: form.notes, tableId: null,
    });
    setForm({ name: "", phone: "", party_size: "2", notes: "", wait: "30" });
    setWalkIn(false);
    location.reload();
  }

  async function handleSeat(id: string) {
    await seatFromWaitlist(id);
    location.reload();
  }

  async function handleRemove(id: string) {
    await removeFromWaitlist(id);
    location.reload();
  }

  function minutesAgo(created: string) {
    const mins = Math.floor((Date.now() - new Date(created).getTime()) / 60000);
    if (mins < 1) return "just now";
    return `${mins}m ago`;
  }

  return (
    <div>
      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => { setAdding(!adding); setWalkIn(false); }}
          className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors ${adding ? "bg-neutral-200 text-neutral-700" : "bg-neutral-900 text-white hover:bg-neutral-700"}`}>
          {adding ? "Cancel" : "+ Add to Waitlist"}
        </button>
        <button onClick={() => { setWalkIn(!walkIn); setAdding(false); }}
          className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors ${walkIn ? "bg-neutral-200 text-neutral-700" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
          {walkIn ? "Cancel" : "Seat Walk-in"}
        </button>
      </div>

      {/* Add form */}
      {(adding || walkIn) && (
        <div className="border-2 border-neutral-200 rounded-xl p-5 mb-6 bg-neutral-50">
          <h4 className="text-sm font-bold text-neutral-900 mb-3">{walkIn ? "Seat Walk-in Now" : "Add to Waitlist"}</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
            <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            <div>
              <select value={form.party_size} onChange={e => setForm({ ...form, party_size: e.target.value })} className={`${inputClass} w-full`}>
                {[1,2,3,4,5,6,7,8,10,12].map(n => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
              </select>
            </div>
            {adding && (
              <select value={form.wait} onChange={e => setForm({ ...form, wait: e.target.value })} className={`${inputClass} w-full`}>
                {[10,15,20,30,45,60,90].map(n => <option key={n} value={n}>{n} min wait</option>)}
              </select>
            )}
          </div>
          <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`${inputClass} w-full mb-3`} />
          <button onClick={walkIn ? handleWalkIn : handleAddWaitlist}
            className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 transition-colors">
            {walkIn ? "Seat Now" : "Add to Waitlist"}
          </button>
        </div>
      )}

      {/* Waitlist entries */}
      {waitlist.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-neutral-400 text-lg mb-2">No one on the waitlist</p>
          <p className="text-neutral-300 text-sm">Add walk-in guests or create a waitlist entry above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {waitlist.map((entry, i) => (
            <div key={entry.id} className="flex items-center justify-between border-2 border-neutral-200 rounded-xl px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold tabular-nums text-neutral-300 w-8">{i + 1}</div>
                <div>
                  <div className="text-base font-bold text-neutral-900">{entry.name}</div>
                  <div className="text-sm text-neutral-500">
                    {entry.party_size} guests · ~{entry.quoted_wait_minutes}m wait · added {minutesAgo(entry.created_at)}
                  </div>
                  {entry.notes && <div className="text-xs text-neutral-400 mt-0.5">{entry.notes}</div>}
                  {entry.phone && <div className="text-xs text-neutral-400">{entry.phone}</div>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleSeat(entry.id)}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg active:bg-emerald-700">
                  Seat
                </button>
                <button onClick={() => handleRemove(entry.id)}
                  className="px-3 py-2.5 text-xs font-medium text-rose-700 bg-rose-100 rounded-lg active:bg-rose-200">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
