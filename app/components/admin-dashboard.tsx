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
  clients?: { name: string; email: string; phone: string };
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

type Tab = "bookings" | "guests";

export function AdminDashboard({
  businessId, businessName, slug, bookings, clients,
}: {
  businessId: string; businessName: string; slug: string;
  bookings: Booking[]; clients: BizClient[];
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
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Today" value={todaysBookings.length} sub={`${todayCovers} covers`} />
        <StatCard label="Upcoming" value={upcomingBookings.length} sub="next 14 days" />
        <StatCard label="Total Guests" value={clients.length} />
        <StatCard label="Repeat Guests" value={clients.filter((c) => c.visit_count > 1).length} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-warm-200 mb-6">
        <TabBtn active={tab === "bookings"} onClick={() => setTab("bookings")}>Bookings</TabBtn>
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

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
