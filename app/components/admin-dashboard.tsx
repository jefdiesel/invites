"use client";

import { useState, useMemo } from "react";
import {
  updateBookingStatus, cancelBooking, seatBooking, completeBooking, noShowBooking, assignTable,
  addMenuItem, updateMenuItem, deleteMenuItem,
  updateBusinessSettings, updateBusinessHours,
  addPhoto, deletePhoto,
  updateCustomDomain,
  setBusinessLive,
  adminCancelBooking,
  adminCancelAllDay,
  updateTableInventory,
  toggleSlotBlock,
} from "@/lib/restaurant-actions";
import type { Theme } from "@/lib/themes";

// ── Types ──

type Booking = {
  id: string; booking_date: string; booking_time: string; party_size: number;
  status: string; notes: string; source: string; table_id: string | null;
  duration_minutes: number | null;
  clients?: { name: string; email: string; phone: string };
};

type RestaurantTable = {
  id: string; name: string; zone: string; capacity: number;
  is_active: boolean; sort_order: number;
};

type BizClient = {
  id: string; client_id: string; notes: string; tags: string[];
  preferences: string; dietary: string; first_visit: string | null;
  last_visit: string | null; visit_count: number; total_spend_cents: number;
  clients?: { name: string; email: string; phone: string; city: string };
};

type MenuItem = {
  id: string; category: string; name: string; description: string;
  price_cents: number; dietary_flags: string[]; available: boolean; sort_order: number;
};

type Hour = {
  id: string; day_of_week: number; open_time: string; close_time: string;
  last_seating: string | null; is_closed: boolean;
};

type Photo = {
  id: string; url: string; alt: string; caption: string; category: string; sort_order: number;
};

type Business = {
  id: string; name: string; slug: string; type: string; theme: string;
  about: string; about_story: string; about_headline: string;
  cuisine: string; price_range: string; address: string; city: string;
  state: string; zip: string; phone: string; email: string;
  cover_image_url: string; logo_url: string;
  slot_duration_minutes: number; booking_window_days: number;
  min_party_size: number; max_party_size: number;
  slot_interval_minutes: number;
};

type BookingStat = {
  booking_date: string; booking_time: string; party_size: number;
  status: string; source: string;
};

type Tab = "reservations" | "tables" | "menu" | "site" | "photos" | "guests" | "analytics" | "domain";

// ── Main Component ──

type WaitlistEntry = {
  id: string; name: string; phone: string; party_size: number;
  notes: string; status: string; quoted_wait_minutes: number; created_at: string;
};

type InventoryRow = { id: string; size: number; count: number; turn_time_minutes: number };

export function AdminDashboard({
  business, slug, theme, bookings, clients, tables, hours, menu, photos, stats, waitlist, inventory, allBookings,
}: {
  business: Business; slug: string; theme: Theme;
  bookings: Booking[]; clients: BizClient[]; tables: RestaurantTable[];
  hours: Hour[]; menu: MenuItem[]; photos: Photo[]; stats: BookingStat[];
  waitlist: WaitlistEntry[];
  inventory: InventoryRow[];
  allBookings: Booking[];
}) {
  const [tab, setTab] = useState<Tab>("reservations");
  const [isLive, setIsLive] = useState((business as Record<string, unknown>).is_live as boolean ?? false);
  const [togglingLive, setTogglingLive] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter((b) => b.booking_date === today);
  const upcomingBookings = bookings.filter((b) => b.booking_date > today);
  const todayCovers = todaysBookings.reduce((s, b) => s + b.party_size, 0);

  async function handleToggleLive() {
    setTogglingLive(true);
    await setBusinessLive(business.id, !isLive);
    setIsLive(!isLive);
    setTogglingLive(false);
  }

  return (
    <div>
      {/* Live status banner */}
      {!isLive && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-5 py-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-sm font-semibold text-amber-800">Your site is not live — reservations are disabled for guests.</span>
          </div>
          <button onClick={handleToggleLive} disabled={togglingLive}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {togglingLive ? "..." : "Go Live"}
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Today" value={todaysBookings.length} sub={`${todayCovers} covers`} />
        <StatCard label="Upcoming" value={upcomingBookings.length} sub="next 14 days" />
        <StatCard label="Tables" value={tables.filter(t => t.is_active).length} sub={`${tables.reduce((s, t) => s + (t.is_active ? t.capacity : 0), 0)} seats`} />
        <StatCard label="Menu Items" value={menu.length} sub={`${new Set(menu.map(m => m.category)).size} categories`} />
        <StatCard label="Guests" value={clients.length} sub={`${clients.filter(c => c.visit_count > 1).length} repeat`} />
        {waitlist.length > 0 && <StatCard label="Waitlist" value={waitlist.length} sub="right now" />}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200 mb-6 overflow-x-auto">
        {(["reservations", "tables", "menu", "site", "domain", "photos", "guests", "analytics"] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = {
            reservations: "Reservations", tables: "Tables", menu: "Menu",
            site: "Site Settings", domain: "Domain", photos: "Photos",
            guests: "Guests", analytics: "Analytics",
          };
          return <TabBtn key={t} active={tab === t} onClick={() => setTab(t)}>{labels[t]}</TabBtn>;
        })}
      </div>

      {tab === "reservations" && (
        <ReservationsTab bookings={bookings} tables={tables} today={today} slotDuration={business.slot_duration_minutes} businessId={business.id} hours={hours} waitlist={waitlist} slotInterval={business.slot_interval_minutes || 30} />
      )}
      {tab === "tables" && (
        <TablesInventoryTab businessId={business.id} inventory={inventory} currentInterval={business.slot_interval_minutes || 30} />
      )}
      {tab === "menu" && (
        <MenuTab menu={menu} businessId={business.id} />
      )}
      {tab === "site" && (
        <SiteTab business={business} slug={slug} hours={hours} isLive={isLive} onToggleLive={handleToggleLive} togglingLive={togglingLive} />
      )}
      {tab === "photos" && (
        <PhotosTab photos={photos} businessId={business.id} />
      )}
      {tab === "guests" && (
        <GuestsTab clients={clients} businessId={business.id} bookings={allBookings} />
      )}
      {tab === "analytics" && (
        <AnalyticsTab stats={stats} clients={clients} />
      )}
      {tab === "domain" && (
        <DomainTab business={business} slug={slug} />
      )}
    </div>
  );
}

// ── Reservations Tab (Calendar View) ──

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ReservationsTab({ bookings, tables, today, slotDuration, businessId, hours, waitlist, slotInterval }: {
  bookings: Booking[]; tables: RestaurantTable[]; today: string; slotDuration: number; businessId: string; hours: Hour[]; waitlist: WaitlistEntry[]; slotInterval: number;
}) {
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(today + "T12:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelNote, setCancelNote] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelAllDate, setCancelAllDate] = useState<string | null>(null);
  const [cancelAllNote, setCancelAllNote] = useState("");
  const [cancellingAll, setCancellingAll] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [blockMode, setBlockMode] = useState<"date" | "weekday" | "all">("date");

  async function loadBlockedSlots(date: string) {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/r/${businessId}/blocked-slots?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setBlockedSlots(new Set((data.blocked as string[]) || []));
      }
    } catch { /* */ }
    setLoadingSlots(false);
  }

  async function handleToggleSlot(time: string) {
    const newBlocked = new Set(blockedSlots);
    if (newBlocked.has(time)) {
      newBlocked.delete(time);
    } else {
      newBlocked.add(time);
    }
    setBlockedSlots(newBlocked);
    await toggleSlotBlock(businessId, time, blockMode, selectedDate);
  }

  const activeTables = tables.filter(t => t.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Open days map (day_of_week -> hours)
  const openDays = new Map(hours.filter(h => !h.is_closed).map(h => [h.day_of_week, h]));

  // Bookings grouped by date
  const bookingsByDate = new Map<string, Booking[]>();
  for (const b of bookings) {
    const arr = bookingsByDate.get(b.booking_date) || [];
    arr.push(b);
    bookingsByDate.set(b.booking_date, arr);
  }

  // Calendar grid for current month
  function getCalendarDays() {
    const first = new Date(viewMonth.year, viewMonth.month, 1);
    const startDay = first.getDay(); // 0=Sun
    const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
    const days: { date: string; day: number; inMonth: boolean }[] = [];

    // Padding before
    for (let i = 0; i < startDay; i++) {
      days.push({ date: "", day: 0, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewMonth.year}-${(viewMonth.month + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
      days.push({ date: dateStr, day: d, inMonth: true });
    }
    return days;
  }

  function prevMonth() {
    setViewMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 });
  }
  function nextMonth() {
    setViewMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 });
  }

  const cancelTarget = cancelId ? bookings.find(b => b.id === cancelId) : null;

  async function handleCancel() {
    if (!cancelId) return;
    setCancelling(true);
    await adminCancelBooking(cancelId, cancelNote);
    setCancelling(false);
    setCancelId(null);
    setCancelNote("");
    location.reload();
  }

  async function handleCancelAll() {
    if (!cancelAllDate) return;
    setCancellingAll(true);
    await adminCancelAllDay(businessId, cancelAllDate, cancelAllNote);
    setCancellingAll(false);
    setCancelAllDate(null);
    setCancelAllNote("");
    location.reload();
  }

  // Selected day's bookings
  const dayBookings = (bookingsByDate.get(selectedDate) || []).sort((a, b) => timeToMins(a.booking_time) - timeToMins(b.booking_time));
  const dayConfirmed = dayBookings.filter(b => b.status === "confirmed");
  const daySeated = dayBookings.filter(b => b.status === "seated");
  const dayDone = dayBookings.filter(b => b.status === "completed" || b.status === "no_show");
  const isToday = selectedDate === today;
  const selectedDow = new Date(selectedDate + "T12:00:00").getDay();
  const selectedHours = openDays.get(selectedDow);
  const dayCovers = dayBookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.party_size, 0);

  const calDays = getCalendarDays();

  return (
    <div>
      {/* Cancel modals */}
      {cancelId && cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setCancelId(null); setCancelNote(""); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-neutral-900 mb-1">Cancel reservation</h3>
            <p className="text-sm text-neutral-500 mb-4">
              {cancelTarget.clients?.name} · {formatTime(cancelTarget.booking_time)} · {cancelTarget.party_size}p
            </p>
            <label className="block text-sm font-semibold text-neutral-600 mb-1">Note to guest (optional)</label>
            <textarea value={cancelNote} onChange={e => setCancelNote(e.target.value)} rows={3}
              placeholder="Sorry, we're closed for a private event..."
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 mb-4" />
            <div className="flex gap-2">
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors">
                {cancelling ? "Cancelling..." : "Cancel & Notify Guest"}
              </button>
              <button onClick={() => { setCancelId(null); setCancelNote(""); }}
                className="px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
                Back
              </button>
            </div>
          </div>
        </div>
      )}
      {cancelAllDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setCancelAllDate(null); setCancelAllNote(""); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-rose-700 mb-1">Cancel all reservations</h3>
            <p className="text-sm text-neutral-500 mb-1">
              {new Date(cancelAllDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-sm text-neutral-500 mb-4">
              {bookings.filter(b => b.booking_date === cancelAllDate && b.status === "confirmed").length} reservations will be cancelled. Each guest gets a separate email.
            </p>
            <label className="block text-sm font-semibold text-neutral-600 mb-1">Note to all guests</label>
            <textarea value={cancelAllNote} onChange={e => setCancelAllNote(e.target.value)} rows={3}
              placeholder="We're closed due to a private event / weather / emergency..."
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 mb-4" />
            <div className="flex gap-2">
              <button onClick={handleCancelAll} disabled={cancellingAll}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors">
                {cancellingAll ? "Cancelling all..." : "Cancel All & Notify Guests"}
              </button>
              <button onClick={() => { setCancelAllDate(null); setCancelAllNote(""); }}
                className="px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        {/* ── Calendar ── */}
        <div>
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
              <button onClick={prevMonth} className="text-neutral-400 hover:text-neutral-900 transition-colors px-1">&larr;</button>
              <span className="text-sm font-bold text-neutral-900">{MONTH_NAMES[viewMonth.month]} {viewMonth.year}</span>
              <button onClick={nextMonth} className="text-neutral-400 hover:text-neutral-900 transition-colors px-1">&rarr;</button>
            </div>
            {/* Day headers */}
            <div className="grid grid-cols-7 text-center border-b border-neutral-100">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-[10px] font-bold text-neutral-400 uppercase py-2">{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7">
              {calDays.map((d, i) => {
                if (!d.inMonth) return <div key={i} className="h-12" />;
                const dow = new Date(d.date + "T12:00:00").getDay();
                const isOpen = openDays.has(dow);
                const dayB = bookingsByDate.get(d.date) || [];
                const activeB = dayB.filter(b => b.status !== "cancelled");
                const covers = activeB.reduce((s, b) => s + b.party_size, 0);
                const isSelected = d.date === selectedDate;
                const isPast = d.date < today;
                const isTodayDate = d.date === today;

                return (
                  <button key={d.date} onClick={() => setSelectedDate(d.date)}
                    className={`h-12 flex flex-col items-center justify-center text-xs transition-colors relative ${
                      isSelected ? "bg-neutral-900 text-white" :
                      isTodayDate ? "bg-blue-50" :
                      !isOpen ? "bg-neutral-50 text-neutral-300" :
                      isPast ? "text-neutral-300" :
                      "hover:bg-neutral-50 text-neutral-700"
                    }`}>
                    <span className={`font-semibold ${isSelected ? "text-white" : isTodayDate ? "text-blue-700" : ""}`}>{d.day}</span>
                    {activeB.length > 0 && (
                      <span className={`text-[9px] tabular-nums leading-none mt-0.5 ${
                        isSelected ? "text-white/70" : "text-neutral-400"
                      }`}>
                        {activeB.length}r · {covers}c
                      </span>
                    )}
                    {!isOpen && !isSelected && (
                      <span className="text-[8px] text-neutral-300">closed</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export */}
          {bookings.length > 0 && (
            <button onClick={() => exportBookingsCSV(bookings, activeTables)}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-700 transition-colors mt-3">
              Export all reservations (CSV)
            </button>
          )}
        </div>

        {/* ── Day Detail ── */}
        <div>
          {/* Day header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                {isToday && <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Today</span>}
              </h3>
              <div className="text-sm text-neutral-500 mt-0.5">
                {selectedHours ? (
                  <>{formatTime(selectedHours.open_time)}–{formatTime(selectedHours.close_time)}
                    {selectedHours.last_seating && <span className="text-neutral-400"> · last seating {formatTime(selectedHours.last_seating)}</span>}
                    {dayBookings.length > 0 && <span className="text-neutral-400"> · {dayBookings.filter(b => b.status !== "cancelled").length} reservations · {dayCovers} covers</span>}
                  </>
                ) : (
                  <span className="text-neutral-400">Closed</span>
                )}
              </div>
            </div>
            {dayConfirmed.length > 0 && (
              <button onClick={() => setCancelAllDate(selectedDate)}
                className="text-xs font-medium text-rose-500 hover:text-rose-700 px-3 py-1.5 rounded bg-rose-50 hover:bg-rose-100 transition-colors">
                Cancel all ({dayConfirmed.length})
              </button>
            )}
          </div>

          {/* Slot toggles */}
          {selectedHours && (
            <div className="mb-6">
              <button onClick={() => { setShowSlots(!showSlots); if (!showSlots) loadBlockedSlots(selectedDate); }}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors mb-2">
                {showSlots ? "Hide slot controls" : "Manage available slots"}
              </button>
              {showSlots && (
                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-neutral-400">Apply to:</span>
                    {(["date", "weekday", "all"] as const).map(m => {
                      const labels = {
                        date: new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                        weekday: `Every ${DAY_NAMES[new Date(selectedDate + "T12:00:00").getDay()]}`,
                        all: "Every day",
                      };
                      return (
                        <button key={m} onClick={() => setBlockMode(m)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                            blockMode === m ? "bg-neutral-900 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400"
                          }`}>{labels[m]}</button>
                      );
                    })}
                  </div>
                  {loadingSlots ? (
                    <p className="text-xs text-neutral-400">Loading...</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const open = timeToMins(selectedHours.open_time);
                        const last = selectedHours.last_seating ? timeToMins(selectedHours.last_seating) : timeToMins(selectedHours.close_time) - 90;
                        const slots: string[] = [];
                        for (let m = open; m <= last; m += slotInterval) {
                          slots.push(formatTime2(m));
                        }
                        return slots.map(time => {
                          const isBlocked = blockedSlots.has(time);
                          return (
                            <button key={time} onClick={() => handleToggleSlot(time)}
                              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                isBlocked
                                  ? "bg-rose-50 border-rose-200 text-rose-500 line-through"
                                  : "bg-white border-neutral-200 text-neutral-900 hover:border-neutral-400"
                              }`}>
                              {fmtTimeShort(time)}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!selectedHours && dayBookings.length === 0 ? (
            <div className="text-center py-12 text-neutral-300">
              <p className="text-base font-medium">Closed</p>
              <p className="text-sm mt-1">No reservations on this day.</p>
            </div>
          ) : dayBookings.length === 0 && waitlist.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p className="text-base font-medium">No reservations yet</p>
            </div>
          ) : (
            <>
              {/* Waitlist (today only) */}
              {isToday && waitlist.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Waitlist ({waitlist.length})</h4>
                  <div className="border border-blue-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-blue-50 border-b border-blue-200">
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600 w-8">#</th>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Name</th>
                          <th className="px-4 py-2 text-right font-semibold text-neutral-600">Party</th>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Wait</th>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Added</th>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Phone</th>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waitlist.map((entry, i) => {
                          const mins = Math.floor((Date.now() - new Date(entry.created_at).getTime()) / 60000);
                          return (
                            <tr key={entry.id} className="border-b border-blue-100 hover:bg-blue-50/50">
                              <td className="px-4 py-2.5 font-bold text-neutral-300">{i + 1}</td>
                              <td className="px-4 py-2.5 font-semibold text-neutral-900">{entry.name}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums font-medium">{entry.party_size}</td>
                              <td className="px-4 py-2.5 text-neutral-500">~{entry.quoted_wait_minutes}m</td>
                              <td className="px-4 py-2.5 tabular-nums text-neutral-500">{mins < 1 ? "now" : `${mins}m ago`}</td>
                              <td className="px-4 py-2.5 text-neutral-400">{entry.phone || "—"}</td>
                              <td className="px-4 py-2.5 text-neutral-500 max-w-[180px] truncate">{entry.notes || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Confirmed / Arriving */}
              {dayConfirmed.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{isToday ? "Arriving" : "Confirmed"} ({dayConfirmed.length})</h4>
                  <div className="border border-neutral-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200">
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Time</th>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Guest</th>
                          <th className="px-4 py-2 text-right font-semibold text-neutral-600">Party</th>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Table</th>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Notes</th>
                          <th className="px-4 py-2 text-right font-semibold text-neutral-600"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayConfirmed.map(b => {
                          const tableName = activeTables.find(t => t.id === b.table_id)?.name;
                          return (
                            <tr key={b.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                              <td className="px-4 py-2.5 tabular-nums font-bold text-neutral-900">{formatTime(b.booking_time)}</td>
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-neutral-900">{b.clients?.name ?? "—"}</div>
                                <div className="text-xs text-neutral-400">{b.clients?.email}</div>
                              </td>
                              <td className="px-4 py-2.5 text-right tabular-nums font-medium">{b.party_size}</td>
                              <td className="px-4 py-2.5 text-neutral-600">{tableName ?? "—"}</td>
                              <td className="px-4 py-2.5 text-neutral-500 max-w-[180px] truncate">{b.notes || "—"}</td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {isToday && <ActionBtn label="Seat" onClick={() => seatBooking(b.id).then(() => location.reload())} color="emerald" />}
                                  {isToday && <ActionBtn label="No-show" onClick={() => noShowBooking(b.id).then(() => location.reload())} color="amber" />}
                                  <ActionBtn label="Cancel" onClick={() => setCancelId(b.id)} color="rose" />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Seated (today only) */}
              {isToday && daySeated.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Seated ({daySeated.length})</h4>
                  <div className="border border-neutral-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200">
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Time Left</th>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Guest</th>
                          <th className="px-4 py-2 text-right font-semibold text-neutral-600">Party</th>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Table</th>
                          <th className="px-4 py-2 text-left font-semibold text-neutral-600">Notes</th>
                          <th className="px-4 py-2 text-right font-semibold text-neutral-600"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {daySeated.map(b => {
                          const end = timeToMins(b.booking_time) + (b.duration_minutes || slotDuration);
                          const minsLeft = end - nowMins;
                          const tableName = activeTables.find(t => t.id === b.table_id)?.name;
                          const turning = minsLeft <= 15;
                          return (
                            <tr key={b.id} className={`border-b border-neutral-100 ${turning ? "bg-amber-50" : "hover:bg-neutral-50"}`}>
                              <td className={`px-4 py-2.5 tabular-nums font-bold ${turning ? "text-amber-700" : "text-neutral-900"}`}>
                                {minsLeft > 0 ? `${minsLeft}m` : "Over"}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-neutral-900">{b.clients?.name ?? "—"}</div>
                                <div className="text-xs text-neutral-400">{b.clients?.email}</div>
                              </td>
                              <td className="px-4 py-2.5 text-right tabular-nums font-medium">{b.party_size}</td>
                              <td className="px-4 py-2.5 text-neutral-600">{tableName ?? "—"}</td>
                              <td className="px-4 py-2.5 text-neutral-500 max-w-[180px] truncate">{b.notes || "—"}</td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <ActionBtn label="Done" onClick={() => completeBooking(b.id).then(() => location.reload())} color="blue" />
                                  <ActionBtn label="No-show" onClick={() => noShowBooking(b.id).then(() => location.reload())} color="amber" />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Done */}
              {dayDone.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Done ({dayDone.length})</h4>
                  <div className="border border-neutral-100 rounded-lg overflow-x-auto">
                    <table className="w-full text-sm text-neutral-400">
                      <tbody>
                        {dayDone.map(b => {
                          const tableName = activeTables.find(t => t.id === b.table_id)?.name;
                          return (
                            <tr key={b.id} className="border-b border-neutral-50">
                              <td className="px-4 py-2 tabular-nums">{formatTime(b.booking_time)}</td>
                              <td className="px-4 py-2">{b.clients?.name ?? "—"}</td>
                              <td className="px-4 py-2 text-right tabular-nums">{b.party_size}</td>
                              <td className="px-4 py-2">{tableName ?? "—"}</td>
                              <td className="px-4 py-2">
                                <span className={b.status === "no_show" ? "text-amber-500 font-medium" : ""}>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function exportBookingsCSV(bookings: Booking[], tables: RestaurantTable[]) {
  const header = "Date,Time,Guest,Email,Phone,Party Size,Table,Status,Source,Notes";
  const rows = bookings.map(b => {
    const tableName = tables.find(t => t.id === b.table_id)?.name ?? "";
    return [
      b.booking_date, b.booking_time, b.clients?.name ?? "", b.clients?.email ?? "",
      b.clients?.phone ?? "", b.party_size, tableName, b.status, b.source, `"${(b.notes || "").replace(/"/g, '""')}"`,
    ].join(",");
  });
  downloadCSV([header, ...rows].join("\n"), "reservations.csv");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Menu Tab ──

function MenuTab({ menu, businessId }: { menu: MenuItem[]; businessId: string }) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ category: "", name: "", description: "", price: "", flags: "" });

  const categories = [...new Set(menu.map(m => m.category))];
  const grouped = categories.map(cat => ({ category: cat, items: menu.filter(m => m.category === cat) }));

  async function handleAdd() {
    if (!newItem.name || !newItem.category) return;
    await addMenuItem(businessId, {
      category: newItem.category,
      name: newItem.name,
      description: newItem.description,
      price_cents: Math.round(parseFloat(newItem.price || "0") * 100),
      dietary_flags: newItem.flags.split(",").map(f => f.trim()).filter(Boolean),
    });
    setNewItem({ category: "", name: "", description: "", price: "", flags: "" });
    setAdding(false);
    location.reload();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteMenuItem(id);
    location.reload();
  }

  async function handleToggle(id: string, available: boolean) {
    await updateMenuItem(id, { available: !available });
    location.reload();
  }

  const inputClass = "border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider">Menu Items ({menu.length})</h3>
        <button onClick={() => setAdding(!adding)} className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
          {adding ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {adding && (
        <div className="border border-neutral-200 rounded-lg p-4 mb-6 bg-neutral-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <input placeholder="Category" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              className={inputClass} list="categories" />
            <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
            <input placeholder="Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className={inputClass} />
            <input placeholder="Price" type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} className={inputClass} />
            <input placeholder="Flags (V, GF, DF)" value={newItem.flags} onChange={e => setNewItem({ ...newItem, flags: e.target.value })} className={inputClass} />
          </div>
          <input placeholder="Description" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })}
            className={`${inputClass} w-full mb-3`} />
          <button onClick={handleAdd} className="px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 transition-colors">
            Add Item
          </button>
        </div>
      )}

      {grouped.map(group => (
        <div key={group.category} className="mb-8">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">{group.category}</h4>
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            {group.items.map((item, i) => (
              <div key={item.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-neutral-100" : ""} ${!item.available ? "opacity-50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-neutral-900">{item.name}</span>
                    {item.dietary_flags?.length > 0 && (
                      <span className="text-xs text-neutral-400">{item.dietary_flags.join(", ")}</span>
                    )}
                  </div>
                  {item.description && <div className="text-xs text-neutral-500 mt-0.5">{item.description}</div>}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-sm tabular-nums font-medium text-neutral-700">${(item.price_cents / 100).toFixed(0)}</span>
                  <button onClick={() => handleToggle(item.id, item.available)}
                    className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
                    {item.available ? "86" : "Un-86"}
                  </button>
                  <button onClick={() => handleDelete(item.id, item.name)}
                    className="text-xs text-rose-400 hover:text-rose-600 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Site Settings Tab ──

function SiteTab({ business, slug, hours, isLive, onToggleLive, togglingLive }: {
  business: Business; slug: string; hours: Hour[]; isLive: boolean; onToggleLive: () => void; togglingLive: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: business.name, about: business.about, about_story: business.about_story || "",
    about_headline: business.about_headline || "", cuisine: business.cuisine,
    price_range: business.price_range, address: business.address, city: business.city,
    state: business.state, zip: business.zip, phone: business.phone, email: business.email,
    cover_image_url: business.cover_image_url || "", logo_url: business.logo_url || "",
    theme: business.theme || "classic",
  });

  async function handleSave() {
    setSaving(true);
    await updateBusinessSettings(business.id, form);
    setSaving(false);
    location.reload();
  }

  const inputClass = "w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";
  const labelClass = "block text-sm font-semibold text-neutral-600 mb-1";

  return (
    <div className="max-w-2xl">
      <div className="space-y-6">
        {/* Live status */}
        <section className="flex items-center justify-between border border-neutral-200 rounded-lg px-5 py-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-emerald-500" : "bg-neutral-300"}`} />
              <span className="text-sm font-bold text-neutral-900">{isLive ? "Live" : "Not live"}</span>
            </div>
            <p className="text-xs text-neutral-500">
              {isLive ? "Guests can book reservations on your site." : "Your site is visible but reservations are disabled."}
            </p>
          </div>
          <button onClick={onToggleLive} disabled={togglingLive}
            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 ${
              isLive ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200" : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}>
            {togglingLive ? "..." : isLive ? "Take Offline" : "Go Live"}
          </button>
        </section>

        {/* QR Check-in */}
        <QRCheckinSection business={business} slug={slug} />

        {/* Basic info */}
        <section>
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">Basic Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Restaurant Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Theme</label>
              <select value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })} className={inputClass}>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="rustic">Rustic</option>
                <option value="playful">Playful</option>
                <option value="bright">Bright</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Cuisine</label>
              <input value={form.cuisine} onChange={e => setForm({ ...form, cuisine: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Price Range</label>
              <select value={form.price_range} onChange={e => setForm({ ...form, price_range: e.target.value })} className={inputClass}>
                <option value="$">$</option>
                <option value="$$">$$</option>
                <option value="$$$">$$$</option>
                <option value="$$$$">$$$$</option>
              </select>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">Contact & Location</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>State</label><input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>ZIP</label><input value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
          </div>
        </section>

        {/* Hours */}
        <HoursEditor hours={hours} businessId={business.id} />

        {/* About */}
        <section>
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">About Page</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Short Description (hero tagline)</label>
              <input value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>About Headline</label>
              <input value={form.about_headline} onChange={e => setForm({ ...form, about_headline: e.target.value })} className={inputClass} placeholder="Our Story" />
            </div>
            <div>
              <label className={labelClass}>Full Story (separate paragraphs with blank lines)</label>
              <textarea value={form.about_story} onChange={e => setForm({ ...form, about_story: e.target.value })} rows={8} className={inputClass} />
            </div>
          </div>
        </section>

        {/* Images */}
        <section>
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">Images</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Cover Image URL</label>
              <input value={form.cover_image_url} onChange={e => setForm({ ...form, cover_image_url: e.target.value })} className={inputClass} placeholder="https://..." />
              {form.cover_image_url && <img src={form.cover_image_url} alt="Cover preview" className="mt-2 rounded-lg h-32 w-full object-cover" />}
            </div>
            <div>
              <label className={labelClass}>Logo URL</label>
              <input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} className={inputClass} placeholder="https://..." />
              {form.logo_url && <img src={form.logo_url} alt="Logo preview" className="mt-2 h-12" />}
            </div>
          </div>
        </section>

        <button onClick={handleSave} disabled={saving}
          className="px-6 py-3 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ── Photos Tab ──

function PhotosTab({ photos, businessId }: { photos: Photo[]; businessId: string }) {
  const [adding, setAdding] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ url: "", alt: "", caption: "", category: "gallery" });

  const categories = [...new Set(photos.map(p => p.category))];

  async function handleAdd() {
    if (!newPhoto.url || !newPhoto.alt.trim()) {
      alert("URL and alt text are required. Alt text is mandatory for accessibility.");
      return;
    }
    await addPhoto(businessId, newPhoto);
    setNewPhoto({ url: "", alt: "", caption: "", category: "gallery" });
    setAdding(false);
    location.reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this photo?")) return;
    await deletePhoto(id);
    location.reload();
  }

  const inputClass = "border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider">Photos ({photos.length})</h3>
        <button onClick={() => setAdding(!adding)} className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
          {adding ? "Cancel" : "+ Add Photo"}
        </button>
      </div>

      {adding && (
        <div className="border border-neutral-200 rounded-lg p-4 mb-6 bg-neutral-50">
          <div className="space-y-3">
            <input placeholder="Image URL" value={newPhoto.url} onChange={e => setNewPhoto({ ...newPhoto, url: e.target.value })} className={`${inputClass} w-full`} />
            <input placeholder="Alt text (required — describe the image)" value={newPhoto.alt} onChange={e => setNewPhoto({ ...newPhoto, alt: e.target.value })} className={`${inputClass} w-full`} />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Caption (optional)" value={newPhoto.caption} onChange={e => setNewPhoto({ ...newPhoto, caption: e.target.value })} className={inputClass} />
              <select value={newPhoto.category} onChange={e => setNewPhoto({ ...newPhoto, category: e.target.value })} className={inputClass}>
                <option value="gallery">Gallery</option>
                <option value="food">Food</option>
                <option value="interior">Interior</option>
                <option value="team">Team</option>
                <option value="about">About Page</option>
              </select>
            </div>
            {newPhoto.url && <img src={newPhoto.url} alt={newPhoto.alt || "Preview"} className="rounded-lg h-32 w-full object-cover" />}
          </div>
          <button onClick={handleAdd} className="mt-3 px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 transition-colors">
            Add Photo
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map(photo => (
          <div key={photo.id} className="group relative">
            <img src={photo.url} alt={photo.alt} className="w-full aspect-square object-cover rounded-lg" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-end p-2 opacity-0 group-hover:opacity-100">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white font-medium truncate">{photo.caption || photo.category}</div>
                <div className="text-[10px] text-white/70 truncate">{photo.alt}</div>
              </div>
              <button onClick={() => handleDelete(photo.id)}
                className="shrink-0 ml-2 text-xs text-white bg-rose-600 px-2 py-1 rounded hover:bg-rose-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Guests Tab ──

function GuestsTab({ clients, businessId, bookings }: { clients: BizClient[]; businessId: string; bookings: Booking[] }) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editDietary, setEditDietary] = useState("");
  const [editPrefs, setEditPrefs] = useState("");
  const [editTags, setEditTags] = useState("");
  const [savingGuest, setSavingGuest] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c =>
      c.clients?.name.toLowerCase().includes(q) ||
      c.clients?.email.toLowerCase().includes(q) ||
      c.clients?.phone?.toLowerCase().includes(q) ||
      c.tags?.some(t => t.toLowerCase().includes(q)) ||
      c.dietary?.toLowerCase().includes(q) ||
      c.notes?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  function startEdit(c: BizClient) {
    setEditingId(c.id);
    setEditNotes(c.notes || "");
    setEditDietary(c.dietary || "");
    setEditPrefs(c.preferences || "");
    setEditTags((c.tags || []).join(", "));
  }

  async function saveEdit(clientId: string) {
    setSavingGuest(true);
    const { updateBusinessClientNotes } = await import("@/lib/restaurant-actions");
    await updateBusinessClientNotes(businessId, clientId, {
      notes: editNotes,
      dietary: editDietary,
      preferences: editPrefs,
      tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
    });
    setEditingId(null);
    setSavingGuest(false);
    location.reload();
  }

  const inputClass = "w-full border border-neutral-200 rounded-lg px-3 py-1.5 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  return (
    <div>
      <div className="mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, tags, dietary, notes..."
          className="w-full max-w-md rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10" />
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-neutral-500">{filtered.length} guests</div>
        {clients.length > 0 && (
          <button onClick={() => exportGuestsCSV(clients)}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            Export Guests (CSV)
          </button>
        )}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center text-neutral-400 py-8">{search ? "No guests match." : "No guests yet."}</div>
        ) : filtered.map(c => (
          <div key={c.id} className="border border-neutral-200 rounded-lg bg-white hover:border-neutral-300 transition-colors">
            <div className="flex items-center gap-4 px-4 py-3 cursor-pointer" onClick={() => editingId === c.id ? setEditingId(null) : startEdit(c)}>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-neutral-900">{c.clients?.name ?? "—"}</div>
                <div className="text-sm text-neutral-400">{c.clients?.email} {c.clients?.phone ? `· ${c.clients.phone}` : ""}</div>
              </div>
              <div className="text-right tabular-nums text-sm">
                <div className="font-medium text-neutral-700">{c.visit_count} visits</div>
                <div className="text-neutral-400">{c.last_visit ? new Date(c.last_visit).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</div>
              </div>
              <div className="flex gap-1 flex-wrap max-w-[200px]">
                {c.tags?.map(t => <span key={t} className="px-1.5 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600">{t}</span>)}
                {c.dietary && <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">{c.dietary}</span>}
              </div>
              <span className="text-neutral-300 text-sm">{editingId === c.id ? "▲" : "▼"}</span>
            </div>

            {editingId === c.id && (
              <div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50 rounded-b-lg">
                {/* Saved info display */}
                {(c.notes || c.preferences || c.dietary || (c.tags && c.tags.length > 0)) && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {c.notes && (
                      <div>
                        <span className="text-xs font-semibold text-neutral-500">Notes</span>
                        <p className="text-sm text-neutral-900 mt-0.5">{c.notes}</p>
                      </div>
                    )}
                    {c.preferences && (
                      <div>
                        <span className="text-xs font-semibold text-neutral-500">Preferences</span>
                        <p className="text-sm text-neutral-900 mt-0.5">{c.preferences}</p>
                      </div>
                    )}
                    {c.dietary && (
                      <div>
                        <span className="text-xs font-semibold text-neutral-500">Dietary</span>
                        <p className="text-sm text-neutral-900 mt-0.5">{c.dietary}</p>
                      </div>
                    )}
                    {c.tags && c.tags.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-neutral-500">Tags</span>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {c.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded text-xs font-medium bg-neutral-200 text-neutral-700">{t}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit fields */}
                <details className="mb-3">
                  <summary className="text-xs font-medium text-neutral-500 cursor-pointer hover:text-neutral-700 mb-2">
                    {(c.notes || c.preferences || c.dietary || (c.tags && c.tags.length > 0)) ? "Edit details" : "Add notes, preferences, dietary, tags"}
                  </summary>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 mb-1 block">Notes</label>
                      <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} className={inputClass} placeholder="Window seat preference, birthday June 4..." />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 mb-1 block">Preferences</label>
                      <textarea value={editPrefs} onChange={e => setEditPrefs(e.target.value)} rows={2} className={inputClass} placeholder="Quiet table, no shellfish..." />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 mb-1 block">Dietary</label>
                      <input value={editDietary} onChange={e => setEditDietary(e.target.value)} className={inputClass} placeholder="Vegetarian, gluten-free, nut allergy..." />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 mb-1 block">Tags (comma separated)</label>
                      <input value={editTags} onChange={e => setEditTags(e.target.value)} className={inputClass} placeholder="VIP, Regular, Industry..." />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(c.client_id)} disabled={savingGuest}
                      className="px-3 py-1.5 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors">
                      {savingGuest ? "Saving..." : "Save"}
                    </button>
                  </div>
                </details>

                {/* Booking history */}
                {(() => {
                  const guestBookings = bookings
                    .filter(b => b.clients?.email === c.clients?.email)
                    .sort((a, b) => b.booking_date.localeCompare(a.booking_date) || b.booking_time.localeCompare(a.booking_time));

                  if (guestBookings.length === 0) return null;

                  return (
                    <div className="border-t border-neutral-200 pt-3">
                      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                        Visit History ({guestBookings.length})
                      </h4>
                      <div className="border border-neutral-200 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-neutral-100 border-b border-neutral-200">
                              <th className="px-3 py-1.5 text-left font-semibold text-neutral-500">Date</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-neutral-500">Time</th>
                              <th className="px-3 py-1.5 text-right font-semibold text-neutral-500">Party</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-neutral-500">Table</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-neutral-500">Status</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-neutral-500">Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guestBookings.map(b => (
                              <tr key={b.id} className="border-b border-neutral-50">
                                <td className="px-3 py-1.5 tabular-nums text-neutral-700">
                                  {new Date(b.booking_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </td>
                                <td className="px-3 py-1.5 tabular-nums text-neutral-700">{formatTime(b.booking_time)}</td>
                                <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">{b.party_size}</td>
                                <td className="px-3 py-1.5 text-neutral-500">{(b as Record<string, unknown>).table_label as string || "—"}</td>
                                <td className="px-3 py-1.5">
                                  <span className={`font-medium ${
                                    b.status === "completed" ? "text-neutral-400" :
                                    b.status === "confirmed" ? "text-emerald-600" :
                                    b.status === "seated" ? "text-blue-600" :
                                    b.status === "cancelled" ? "text-rose-500" :
                                    b.status === "no_show" ? "text-amber-500" :
                                    b.status === "checked_in" ? "text-green-600" :
                                    "text-neutral-400"
                                  }`}>{b.status}</span>
                                </td>
                                <td className="px-3 py-1.5 text-neutral-400">{b.source}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Analytics Tab ──

function AnalyticsTab({ stats, clients }: { stats: BookingStat[]; clients: BizClient[] }) {
  // Group by date
  const byDate = new Map<string, { covers: number; bookings: number; noShows: number }>();
  for (const s of stats) {
    const d = s.booking_date;
    const entry = byDate.get(d) || { covers: 0, bookings: 0, noShows: 0 };
    entry.bookings++;
    entry.covers += s.party_size;
    if (s.status === "no_show") entry.noShows++;
    byDate.set(d, entry);
  }
  const dates = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const maxCovers = Math.max(1, ...dates.map(([, d]) => d.covers));

  // Busiest hours
  const byHour = new Map<number, number>();
  for (const s of stats) {
    if (s.status === "cancelled") continue;
    const h = parseInt(s.booking_time.split(":")[0]);
    byHour.set(h, (byHour.get(h) || 0) + 1);
  }
  const hours = [...byHour.entries()].sort((a, b) => a[0] - b[0]);
  const maxHour = Math.max(1, ...hours.map(([, c]) => c));

  // Source breakdown
  const bySrc = new Map<string, number>();
  for (const s of stats) {
    if (s.status === "cancelled") continue;
    bySrc.set(s.source || "website", (bySrc.get(s.source || "website") || 0) + 1);
  }

  // Totals
  const totalBookings = stats.filter(s => s.status !== "cancelled").length;
  const totalCovers = stats.filter(s => s.status !== "cancelled").reduce((s, b) => s + b.party_size, 0);
  const totalNoShows = stats.filter(s => s.status === "no_show").length;
  const noShowRate = totalBookings > 0 ? ((totalNoShows / totalBookings) * 100).toFixed(1) : "0";

  // Top guests
  const topGuests = [...clients].sort((a, b) => b.visit_count - a.visit_count).slice(0, 5);

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-neutral-200 rounded-lg p-4">
          <div className="text-2xl font-bold tabular-nums text-neutral-900">{totalBookings}</div>
          <div className="text-sm text-neutral-500">Reservations (30d)</div>
        </div>
        <div className="border border-neutral-200 rounded-lg p-4">
          <div className="text-2xl font-bold tabular-nums text-neutral-900">{totalCovers}</div>
          <div className="text-sm text-neutral-500">Total Covers</div>
        </div>
        <div className="border border-neutral-200 rounded-lg p-4">
          <div className="text-2xl font-bold tabular-nums text-amber-600">{noShowRate}%</div>
          <div className="text-sm text-neutral-500">No-show Rate</div>
        </div>
        <div className="border border-neutral-200 rounded-lg p-4">
          <div className="text-2xl font-bold tabular-nums text-neutral-900">{totalBookings > 0 ? (totalCovers / dates.length).toFixed(1) : 0}</div>
          <div className="text-sm text-neutral-500">Avg Covers/Day</div>
        </div>
      </div>

      {/* Covers per day chart */}
      <div className="mb-10">
        <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">Covers per Day</h3>
        {dates.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">No booking data yet.</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {dates.map(([date, d]) => (
              <div key={date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {d.covers} covers, {d.bookings} res
                  {d.noShows > 0 ? `, ${d.noShows} NS` : ""}
                </div>
                <div className="w-full rounded-t" style={{
                  height: `${(d.covers / maxCovers) * 100}%`,
                  background: d.noShows > 0 ? "#f59e0b" : "#171717",
                  minHeight: "2px",
                }} />
              </div>
            ))}
          </div>
        )}
        {dates.length > 0 && (
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
            <span>{new Date(dates[0][0] + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span>{new Date(dates[dates.length - 1][0] + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Busiest hours */}
        <div>
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">Busiest Hours</h3>
          <div className="space-y-2">
            {hours.map(([h, count]) => (
              <div key={h} className="flex items-center gap-3">
                <span className="text-sm tabular-nums text-neutral-500 w-14">{h % 12 || 12}{h >= 12 ? " PM" : " AM"}</span>
                <div className="flex-1 bg-neutral-100 rounded-full h-5 overflow-hidden">
                  <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${(count / maxHour) * 100}%` }} />
                </div>
                <span className="text-sm tabular-nums text-neutral-600 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source breakdown */}
        <div>
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">Booking Sources</h3>
          <div className="space-y-2">
            {[...bySrc.entries()].sort((a, b) => b[1] - a[1]).map(([src, count]) => (
              <div key={src} className="flex items-center justify-between border border-neutral-100 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-neutral-700 capitalize">{src.replace("_", " ")}</span>
                <span className="text-sm tabular-nums font-bold text-neutral-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top guests */}
        <div>
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">Top Guests</h3>
          <div className="space-y-2">
            {topGuests.length === 0 ? (
              <p className="text-sm text-neutral-400">No guests yet.</p>
            ) : topGuests.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3 border border-neutral-100 rounded-lg px-3 py-2">
                <span className="text-sm font-bold text-neutral-300 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-neutral-900 truncate">{g.clients?.name ?? "—"}</div>
                </div>
                <span className="text-sm tabular-nums font-bold text-neutral-700">{g.visit_count} visits</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Domain Tab ──

function DomainTab({ business, slug }: { business: Business; slug: string }) {
  const [domain, setDomain] = useState((business as Record<string, unknown>).custom_domain as string || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateCustomDomain(business.id, domain);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const currentDomain = (business as Record<string, unknown>).custom_domain as string;
  const inputClass = "w-full border border-neutral-200 rounded-lg px-4 py-3 text-base bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  return (
    <div className="max-w-2xl">
      <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">Custom Domain</h3>
      <p className="text-sm text-neutral-500 mb-6">
        Point your own domain to your Remi restaurant site. Your site is always available at{" "}
        <a href={`https://itsremi.app/r/${slug}`} className="font-medium text-neutral-900 underline" target="_blank">
          itsremi.app/r/{slug}
        </a>.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Domain</label>
          <input value={domain} onChange={e => setDomain(e.target.value)}
            placeholder="yourdomain.com" className={inputClass} />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-3 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : "Save Domain"}
          </button>
          {saved && <span className="text-sm font-medium text-emerald-600">Saved</span>}
        </div>

        {/* DNS instructions */}
        <div className="border border-neutral-200 rounded-lg p-6 bg-neutral-50">
          <h4 className="text-sm font-bold text-neutral-900 mb-3">DNS Setup</h4>
          <p className="text-sm text-neutral-500 mb-4">
            Add these records at your domain registrar (Namecheap, GoDaddy, Cloudflare, etc):
          </p>
          <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-2 text-left font-semibold text-neutral-600">Type</th>
                  <th className="px-4 py-2 text-left font-semibold text-neutral-600">Name</th>
                  <th className="px-4 py-2 text-left font-semibold text-neutral-600">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="px-4 py-2 font-mono text-neutral-900">CNAME</td>
                  <td className="px-4 py-2 font-mono text-neutral-700">{domain ? domain.replace(/^www\./, "") : "yourdomain.com"}</td>
                  <td className="px-4 py-2 font-mono text-neutral-700">cname.vercel-dns.com</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-neutral-900">CNAME</td>
                  <td className="px-4 py-2 font-mono text-neutral-700">www</td>
                  <td className="px-4 py-2 font-mono text-neutral-700">cname.vercel-dns.com</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 mt-3">
            SSL is automatic. After DNS propagates (up to 48 hours), your site will be live at your domain.
          </p>
        </div>

        {currentDomain && (
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-neutral-600">
              Domain configured: <span className="font-mono font-medium text-neutral-900">{currentDomain}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── QR Check-in Section ──

function QRCheckinSection({ business, slug }: { business: Business; slug: string }) {
  const [qrWaitlist, setQrWaitlist] = useState((business as Record<string, unknown>).qr_waitlist_enabled as boolean ?? false);
  const [qrCheckin, setQrCheckin] = useState((business as Record<string, unknown>).qr_checkin_enabled as boolean ?? false);
  const [saving, setSaving] = useState(false);

  async function toggleWaitlist() {
    setSaving(true);
    const val = !qrWaitlist;
    await updateBusinessSettings(business.id, { qr_waitlist_enabled: val });
    setQrWaitlist(val);
    setSaving(false);
  }

  async function toggleCheckin() {
    setSaving(true);
    const val = !qrCheckin;
    await updateBusinessSettings(business.id, { qr_checkin_enabled: val });
    setQrCheckin(val);
    setSaving(false);
  }

  const checkinUrl = `https://itsremi.app/r/${slug}/checkin`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkinUrl)}`;
  const anyEnabled = qrWaitlist || qrCheckin;

  return (
    <section className="border border-neutral-200 rounded-lg px-5 py-4">
      <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">QR Check-in</h3>
      <p className="text-xs text-neutral-400 mb-4">
        Generate a QR code for your host stand. Guests scan to join the waitlist or check in for their reservation.
      </p>

      <div className="space-y-3 mb-4">
        <label className="flex items-center justify-between cursor-pointer" onClick={toggleWaitlist}>
          <div>
            <div className="text-sm font-semibold text-neutral-900">Self-service waitlist</div>
            <div className="text-xs text-neutral-400">Guests add themselves to the waitlist by scanning</div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors relative ${qrWaitlist ? "bg-neutral-900" : "bg-neutral-200"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${qrWaitlist ? "left-[18px]" : "left-0.5"}`} />
          </div>
        </label>

        <label className="flex items-center justify-between cursor-pointer" onClick={toggleCheckin}>
          <div>
            <div className="text-sm font-semibold text-neutral-900">Reservation check-in</div>
            <div className="text-xs text-neutral-400">Guests with a reservation scan to check in on arrival</div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors relative ${qrCheckin ? "bg-neutral-900" : "bg-neutral-200"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${qrCheckin ? "left-[18px]" : "left-0.5"}`} />
          </div>
        </label>
      </div>

      {anyEnabled && (
        <div className="flex items-start gap-4 pt-4 border-t border-neutral-100">
          <img src={qrImgUrl} alt="QR code for check-in" className="w-28 h-28 rounded-lg border border-neutral-200" />
          <div>
            <p className="text-sm font-medium text-neutral-900 mb-1">Print this QR code</p>
            <p className="text-xs text-neutral-400 mb-2">Place at your host stand or entrance. Guests scan with their phone camera.</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-600">{checkinUrl}</code>
              <button onClick={() => navigator.clipboard.writeText(checkinUrl)}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {!anyEnabled && (
        <p className="text-xs text-neutral-400 pt-2">Enable at least one option to generate a QR code.</p>
      )}
    </section>
  );
}

// ── Export Helpers ──

function exportGuestsCSV(clients: BizClient[]) {
  const header = "Name,Email,Phone,City,Visits,Last Visit,Tags,Dietary,Preferences,Notes";
  const rows = clients.map(c => [
    `"${(c.clients?.name ?? "").replace(/"/g, '""')}"`,
    c.clients?.email ?? "", c.clients?.phone ?? "", c.clients?.city ?? "",
    c.visit_count,
    c.last_visit ? new Date(c.last_visit).toLocaleDateString() : "",
    `"${(c.tags || []).join(", ")}"`,
    `"${(c.dietary || "").replace(/"/g, '""')}"`,
    `"${(c.preferences || "").replace(/"/g, '""')}"`,
    `"${(c.notes || "").replace(/"/g, '""')}"`,
  ].join(","));
  downloadCSV([header, ...rows].join("\n"), "guests.csv");
}

// ── Shared Components ──

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <div className="text-2xl font-bold tabular-nums text-neutral-900">{value}</div>
      <div className="text-sm text-neutral-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-neutral-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
        active ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-700"
      }`}>
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-emerald-500/10 text-emerald-600",
    checked_in: "bg-green-500/10 text-green-700 ring-1 ring-green-300",
    seated: "bg-blue-500/10 text-blue-600",
    completed: "bg-neutral-100 text-neutral-500",
    cancelled: "bg-rose-500/10 text-rose-600",
    no_show: "bg-amber-500/10 text-amber-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] ?? "bg-neutral-100 text-neutral-500"}`}>
      {status}
    </span>
  );
}

function ActionBtn({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-600 hover:bg-emerald-50",
    blue: "text-blue-600 hover:bg-blue-50",
    amber: "text-amber-600 hover:bg-amber-50",
    rose: "text-rose-600 hover:bg-rose-50",
  };
  return (
    <button onClick={onClick} className={`px-2 py-1 text-xs font-medium rounded transition-colors ${colors[color] ?? ""}`}>
      {label}
    </button>
  );
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function HoursEditor({ hours: initialHours, businessId }: { hours: Hour[]; businessId: string }) {
  const [hours, setHours] = useState<Hour[]>(() => {
    // Ensure all 7 days exist
    const existing = new Map(initialHours.map(h => [h.day_of_week, h]));
    return Array.from({ length: 7 }, (_, i) => existing.get(i) ?? {
      id: `new-${i}`, day_of_week: i, open_time: "17:00", close_time: "22:00", last_seating: "20:30", is_closed: true,
    });
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateDay(day: number, field: string, value: string | boolean) {
    setHours(prev => prev.map(h => h.day_of_week === day ? { ...h, [field]: value } : h));
  }

  async function handleSave() {
    setSaving(true);
    await updateBusinessHours(businessId, hours.map(h => ({
      day_of_week: h.day_of_week,
      open_time: h.open_time,
      close_time: h.close_time,
      last_seating: h.last_seating,
      is_closed: h.is_closed,
    })));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputClass = "border border-neutral-200 rounded-lg px-2 py-1.5 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  return (
    <section>
      <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">Hours</h3>
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-3 py-2 text-left font-semibold text-neutral-600 w-28">Day</th>
              <th className="px-3 py-2 text-center font-semibold text-neutral-600 w-16">Open</th>
              <th className="px-3 py-2 text-left font-semibold text-neutral-600">Opens</th>
              <th className="px-3 py-2 text-left font-semibold text-neutral-600">Closes</th>
              <th className="px-3 py-2 text-left font-semibold text-neutral-600">Last Seating</th>
            </tr>
          </thead>
          <tbody>
            {hours.map(h => (
              <tr key={h.day_of_week} className="border-b border-neutral-100">
                <td className="px-3 py-2 font-medium text-neutral-900">{DAYS[h.day_of_week]}</td>
                <td className="px-3 py-2 text-center">
                  <input type="checkbox" checked={!h.is_closed} onChange={e => updateDay(h.day_of_week, "is_closed", !e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300" />
                </td>
                <td className="px-3 py-2">
                  {!h.is_closed && <input type="time" value={h.open_time} onChange={e => updateDay(h.day_of_week, "open_time", e.target.value)} className={inputClass} />}
                  {h.is_closed && <span className="text-neutral-400">Closed</span>}
                </td>
                <td className="px-3 py-2">
                  {!h.is_closed && <input type="time" value={h.close_time} onChange={e => updateDay(h.day_of_week, "close_time", e.target.value)} className={inputClass} />}
                </td>
                <td className="px-3 py-2">
                  {!h.is_closed && <input type="time" value={h.last_seating ?? ""} onChange={e => updateDay(h.day_of_week, "last_seating", e.target.value)} className={inputClass} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving..." : "Save Hours"}
        </button>
        {saved && <span className="text-sm font-medium text-emerald-600">Saved</span>}
      </div>
    </section>
  );
}

function TablesInventoryTab({ businessId, inventory: initial, currentInterval }: { businessId: string; inventory: InventoryRow[]; currentInterval: number }) {
  const DEFAULT_SIZES = [
    { size: 2, label: "2-tops", defaultTurn: 60 },
    { size: 4, label: "4-tops", defaultTurn: 90 },
    { size: 6, label: "6-tops", defaultTurn: 120 },
    { size: 8, label: "8-tops", defaultTurn: 120 },
  ];

  const [rows, setRows] = useState(() =>
    DEFAULT_SIZES.map(d => {
      const existing = initial.find(i => i.size === d.size);
      return {
        size: d.size, label: d.label,
        count: existing?.count ?? 0,
        turn: existing?.turn_time_minutes ?? d.defaultTurn,
      };
    })
  );
  const [interval, setInterval_] = useState(currentInterval);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateTableInventory(businessId, rows.map(r => ({
      size: r.size, count: r.count, turn_time_minutes: r.turn,
    })));
    // Save interval setting
    await updateBusinessSettings(businessId, { slot_interval_minutes: interval } as Record<string, unknown>);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const totalTables = rows.reduce((s, r) => s + r.count, 0);
  const totalSeats = rows.reduce((s, r) => s + r.count * r.size, 0);

  const inputClass = "border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 w-20 text-center tabular-nums";

  return (
    <div className="max-w-xl">
      <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-2">Table Inventory</h3>
      <p className="text-sm text-neutral-400 mb-6">
        Set how many tables of each size you have and how long each turn lasts. This controls reservation availability.
      </p>

      <div className="border border-neutral-200 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Table Size</th>
              <th className="px-4 py-2.5 text-center font-semibold text-neutral-600">Count</th>
              <th className="px-4 py-2.5 text-center font-semibold text-neutral-600">Turn Time</th>
              <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Party Sizes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.size} className="border-b border-neutral-100">
                <td className="px-4 py-3 font-semibold text-neutral-900">{r.label}</td>
                <td className="px-4 py-3 text-center">
                  <input type="number" min={0} max={50} value={r.count}
                    onChange={e => setRows(prev => prev.map((p, j) => j === i ? { ...p, count: parseInt(e.target.value) || 0 } : p))}
                    className={inputClass} />
                </td>
                <td className="px-4 py-3 text-center">
                  <select value={r.turn}
                    onChange={e => setRows(prev => prev.map((p, j) => j === i ? { ...p, turn: parseInt(e.target.value) } : p))}
                    className="border border-neutral-200 rounded-lg px-2 py-2 text-sm bg-white text-neutral-900 focus:outline-none">
                    <option value={60}>60 min</option>
                    <option value={75}>75 min</option>
                    <option value={90}>90 min</option>
                    <option value={105}>105 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-neutral-400 text-xs">
                  {r.size === 2 ? "1-2 guests" : r.size === 4 ? "3-4 guests" : r.size === 6 ? "5-6 guests" : "7-8 guests"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slot interval */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-sm text-neutral-500">{totalTables} tables · {totalSeats} seats</div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-neutral-600">Slot interval:</label>
          <select value={interval} onChange={e => setInterval_(parseInt(e.target.value))}
            className="border border-neutral-200 rounded-lg px-2 py-1.5 text-sm bg-white text-neutral-900">
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        {saved && <span className="text-sm font-medium text-emerald-600">Saved</span>}
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="border border-neutral-200 rounded-lg px-5 py-4 bg-neutral-50">
        <h4 className="text-sm font-bold text-neutral-900 mb-2">How it works</h4>
        <ul className="text-xs text-neutral-500 space-y-1">
          <li>Guests are matched to the smallest table that fits: 1-2 guests → 2-top, 3-4 → 4-top, etc.</li>
          <li>A party of 2 won't be given a 4-top — if 2-tops are full, that time shows as unavailable for parties of 2.</li>
          <li>Turn time determines how long a table is locked. A 90-min turn at 6 PM blocks that table until 7:30 PM.</li>
          <li>Guests must book at least 2 hours in advance. Walk-ins and waitlist handle same-day.</li>
        </ul>
      </div>
    </div>
  );
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

function formatTime2(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function fmtTimeShort(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
