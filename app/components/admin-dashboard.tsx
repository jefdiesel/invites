"use client";

import { useState, useMemo } from "react";

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

type RestaurantTable = {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  is_active: boolean;
  sort_order: number;
};

type BizClient = {
  id: string;
  client_id: string;
  notes: string;
  tags: string[];
  preferences: string;
  dietary: string;
  first_visit: string | null;
  last_visit: string | null;
  visit_count: number;
  total_spend_cents: number;
  clients?: { name: string; email: string; phone: string; city: string };
};

type Tab = "bookings" | "guests" | "tables";

export function AdminDashboard({
  businessId, businessName, slug, bookings, clients, tables,
}: {
  businessId: string; businessName: string; slug: string;
  bookings: Booking[]; clients: BizClient[]; tables: RestaurantTable[];
}) {
  const [tab, setTab] = useState<Tab>("bookings");
  const [search, setSearch] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter((b) => b.booking_date === today);
  const upcomingBookings = bookings.filter((b) => b.booking_date > today);
  const todayCovers = todaysBookings.reduce((s, b) => s + b.party_size, 0);

  // Filtered guests
  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter((c) =>
      c.clients?.name.toLowerCase().includes(q) ||
      c.clients?.email.toLowerCase().includes(q) ||
      c.clients?.phone?.toLowerCase().includes(q) ||
      c.clients?.city?.toLowerCase().includes(q) ||
      c.tags?.some((t) => t.toLowerCase().includes(q)) ||
      c.dietary?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="Today" value={todaysBookings.length} sub={`${todayCovers} covers`} />
        <StatCard label="Upcoming" value={upcomingBookings.length} sub="next 14 days" />
        <StatCard label="Tables" value={tables.filter(t => t.is_active).length} sub={`${tables.reduce((s, t) => s + (t.is_active ? t.capacity : 0), 0)} total seats`} />
        <StatCard label="Total Guests" value={clients.length} />
        <StatCard label="Repeat Guests" value={clients.filter((c) => c.visit_count > 1).length} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-warm-200 mb-6">
        <TabBtn active={tab === "bookings"} onClick={() => setTab("bookings")}>Bookings</TabBtn>
        <TabBtn active={tab === "tables"} onClick={() => setTab("tables")}>Tables</TabBtn>
        <TabBtn active={tab === "guests"} onClick={() => setTab("guests")}>Guests</TabBtn>
      </div>

      {tab === "bookings" && (
        <div>
          {todaysBookings.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-warm-600 uppercase tracking-wider mb-3">Today</h3>
              <BookingTable bookings={todaysBookings} />
            </div>
          )}
          {upcomingBookings.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-warm-600 uppercase tracking-wider mb-3">Upcoming</h3>
              <BookingTable bookings={upcomingBookings} />
            </div>
          )}
          {todaysBookings.length === 0 && upcomingBookings.length === 0 && (
            <p className="text-sm text-warm-400 py-8 text-center">No bookings yet.</p>
          )}
        </div>
      )}

      {tab === "tables" && (
        <TableGrid tables={tables} bookings={todaysBookings} allBookings={bookings} />
      )}

      {tab === "guests" && (
        <div>
          <div className="mb-4">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, city, tags..."
              className="w-full max-w-md rounded-lg border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
          </div>
          <div className="text-sm text-warm-500 mb-3">{filteredClients.length} guests</div>
          <div className="border border-warm-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-50 border-b border-warm-200">
                  <th className="px-4 py-2.5 text-left font-semibold text-warm-600">Name</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-warm-600">Email</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-warm-600">Phone</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-warm-600">Visits</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-warm-600">Last Visit</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-warm-600">Tags</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-warm-600">Dietary</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-warm-400">{search ? "No guests match." : "No guests yet."}</td></tr>
                ) : (
                  filteredClients.map((c) => (
                    <tr key={c.id} className="border-b border-warm-100 hover:bg-warm-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-warm-900">{c.clients?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-warm-500">{c.clients?.email ?? "—"}</td>
                      <td className="px-4 py-3 text-warm-500">{c.clients?.phone || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-warm-700">{c.visit_count}</td>
                      <td className="px-4 py-3 text-warm-500 tabular-nums">
                        {c.last_visit ? new Date(c.last_visit).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {c.tags && c.tags.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {c.tags.map((t) => (
                              <span key={t} className="px-1.5 py-0.5 rounded text-xs font-medium bg-accent-muted text-accent">{t}</span>
                            ))}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-warm-500">{c.dietary || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="border border-warm-200 rounded-lg p-4">
      <div className="text-2xl font-bold tabular-nums text-warm-900">{value}</div>
      <div className="text-sm text-warm-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-warm-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
        active ? "border-accent text-accent" : "border-transparent text-warm-500 hover:text-warm-700"
      }`}>
      {children}
    </button>
  );
}

function BookingTable({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="border border-warm-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-warm-50 border-b border-warm-200">
            <th className="px-4 py-2.5 text-left font-semibold text-warm-600">Time</th>
            <th className="px-4 py-2.5 text-left font-semibold text-warm-600">Guest</th>
            <th className="px-4 py-2.5 text-right font-semibold text-warm-600">Party</th>
            <th className="px-4 py-2.5 text-left font-semibold text-warm-600">Status</th>
            <th className="px-4 py-2.5 text-left font-semibold text-warm-600">Notes</th>
            <th className="px-4 py-2.5 text-left font-semibold text-warm-600">Date</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-warm-100 hover:bg-warm-50 transition-colors">
              <td className="px-4 py-3 tabular-nums font-medium text-warm-900">{formatTime(b.booking_time)}</td>
              <td className="px-4 py-3">
                <div className="font-semibold text-warm-900">{b.clients?.name ?? "—"}</div>
                <div className="text-xs text-warm-400">{b.clients?.email}</div>
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-warm-700">{b.party_size}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  b.status === "confirmed" ? "bg-emerald-500/10 text-emerald-600" :
                  b.status === "seated" ? "bg-blue-500/10 text-blue-600" :
                  b.status === "completed" ? "bg-warm-100 text-warm-500" :
                  b.status === "cancelled" ? "bg-rose-500/10 text-rose-600" :
                  b.status === "no_show" ? "bg-amber-500/10 text-amber-600" :
                  "bg-warm-100 text-warm-500"
                }`}>{b.status}</span>
              </td>
              <td className="px-4 py-3 text-warm-500 max-w-[200px] truncate">{b.notes || "—"}</td>
              <td className="px-4 py-3 text-warm-500 tabular-nums">
                {new Date(b.booking_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableGrid({ tables, bookings, allBookings }: { tables: RestaurantTable[]; bookings: Booking[]; allBookings: Booking[] }) {
  const activeTables = tables.filter((t) => t.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const zones = [...new Set(activeTables.map((t) => t.zone || "Main"))];

  // Generate time slots for today (5 PM - 10 PM in 30-min increments)
  const timeSlots: string[] = [];
  for (let h = 17; h <= 22; h++) {
    timeSlots.push(`${h.toString().padStart(2, "0")}:00`);
    if (h < 22) timeSlots.push(`${h.toString().padStart(2, "0")}:30`);
  }

  // Find which table a booking is on, or which table it could go on
  function getBookingForSlot(table: RestaurantTable, time: string): Booking | null {
    const timeMins = timeToMins(time);
    return bookings.find((b) => {
      if (b.table_id && b.table_id !== table.id) return false;
      if (!b.table_id && b.party_size > table.capacity) return false;
      const bMins = timeToMins(b.booking_time);
      const bEnd = bMins + (b.duration_minutes || 90);
      return timeMins >= bMins && timeMins < bEnd;
    }) ?? null;
  }

  // Summary
  const totalSeats = activeTables.reduce((s, t) => s + t.capacity, 0);
  const todayCovers = bookings.reduce((s, b) => s + b.party_size, 0);

  return (
    <div>
      {/* Table inventory */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-warm-600 uppercase tracking-wider">Table Inventory</h3>
          <span className="text-sm text-warm-500">{activeTables.length} tables · {totalSeats} seats · {todayCovers} covers today</span>
        </div>
        {zones.map((zone) => {
          const zoneTables = activeTables.filter((t) => (t.zone || "Main") === zone);
          return (
            <div key={zone} className="mb-4">
              <div className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-2">{zone}</div>
              <div className="flex gap-2 flex-wrap">
                {zoneTables.map((t) => {
                  const hasBookingNow = bookings.some((b) => {
                    if (b.table_id && b.table_id !== t.id) return false;
                    if (!b.table_id) return false;
                    const now = new Date();
                    const bMins = timeToMins(b.booking_time);
                    const bEnd = bMins + 90;
                    const nowMins = now.getHours() * 60 + now.getMinutes();
                    return nowMins >= bMins && nowMins < bEnd;
                  });
                  return (
                    <div key={t.id}
                      className={`border rounded-lg px-4 py-3 text-center min-w-[80px] ${
                        hasBookingNow
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700"
                      }`}>
                      <div className="text-sm font-bold">{t.name}</div>
                      <div className="text-xs mt-0.5">{t.capacity} seats</div>
                      <div className="text-[10px] mt-1 font-medium">{hasBookingNow ? "OCCUPIED" : "OPEN"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <h3 className="text-sm font-bold text-warm-600 uppercase tracking-wider mb-3">Today&apos;s Floor</h3>
      <div className="border border-warm-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-50 border-b border-warm-200">
              <th className="px-3 py-2.5 text-left font-semibold text-warm-600 sticky left-0 bg-warm-50 z-10 min-w-[80px]">Table</th>
              {timeSlots.map((t) => (
                <th key={t} className="px-2 py-2.5 text-center font-medium text-warm-500 text-xs whitespace-nowrap min-w-[70px]">
                  {formatTime(t)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeTables.map((table) => (
              <tr key={table.id} className="border-b border-warm-100">
                <td className="px-3 py-2 sticky left-0 bg-white z-10">
                  <div className="font-semibold text-warm-900">{table.name}</div>
                  <div className="text-xs text-warm-400">{table.capacity} seats</div>
                </td>
                {timeSlots.map((time) => {
                  const booking = getBookingForSlot(table, time);
                  if (!booking) {
                    return <td key={time} className="px-2 py-2 text-center text-warm-200">—</td>;
                  }
                  // Only render the booking cell at the start time
                  const isStart = booking.booking_time.slice(0, 5) === time;
                  if (!isStart) {
                    return (
                      <td key={time} className="px-1 py-2">
                        <div className="h-8 bg-accent/10 border-y border-accent/20" />
                      </td>
                    );
                  }
                  return (
                    <td key={time} className="px-1 py-2">
                      <div className="bg-accent/10 border border-accent/30 rounded px-1.5 py-1 text-xs">
                        <div className="font-semibold text-accent truncate">{booking.clients?.name}</div>
                        <div className="text-warm-500">{booking.party_size}p</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
