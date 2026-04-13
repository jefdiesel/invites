"use client";

import { useState, useMemo } from "react";
import {
  updateBookingStatus, cancelBooking, seatBooking, completeBooking, noShowBooking, assignTable,
  addMenuItem, updateMenuItem, deleteMenuItem,
  updateBusinessSettings, updateBusinessHours,
  addPhoto, deletePhoto,
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
};

type Tab = "reservations" | "menu" | "site" | "photos" | "guests";

// ── Main Component ──

export function AdminDashboard({
  business, slug, theme, bookings, clients, tables, hours, menu, photos,
}: {
  business: Business; slug: string; theme: Theme;
  bookings: Booking[]; clients: BizClient[]; tables: RestaurantTable[];
  hours: Hour[]; menu: MenuItem[]; photos: Photo[];
}) {
  const [tab, setTab] = useState<Tab>("reservations");

  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter((b) => b.booking_date === today);
  const upcomingBookings = bookings.filter((b) => b.booking_date > today);
  const todayCovers = todaysBookings.reduce((s, b) => s + b.party_size, 0);

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Today" value={todaysBookings.length} sub={`${todayCovers} covers`} />
        <StatCard label="Upcoming" value={upcomingBookings.length} sub="next 14 days" />
        <StatCard label="Tables" value={tables.filter(t => t.is_active).length} sub={`${tables.reduce((s, t) => s + (t.is_active ? t.capacity : 0), 0)} seats`} />
        <StatCard label="Menu Items" value={menu.length} sub={`${new Set(menu.map(m => m.category)).size} categories`} />
        <StatCard label="Guests" value={clients.length} sub={`${clients.filter(c => c.visit_count > 1).length} repeat`} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200 mb-6 overflow-x-auto">
        {(["reservations", "menu", "site", "photos", "guests"] as Tab[]).map((t) => (
          <TabBtn key={t} active={tab === t} onClick={() => setTab(t)}>
            {t === "reservations" ? "Reservations" : t === "menu" ? "Menu" : t === "site" ? "Site Settings" : t === "photos" ? "Photos" : "Guests"}
          </TabBtn>
        ))}
      </div>

      {tab === "reservations" && (
        <ReservationsTab bookings={bookings} tables={tables} today={today} slotDuration={business.slot_duration_minutes} />
      )}
      {tab === "menu" && (
        <MenuTab menu={menu} businessId={business.id} />
      )}
      {tab === "site" && (
        <SiteTab business={business} hours={hours} />
      )}
      {tab === "photos" && (
        <PhotosTab photos={photos} businessId={business.id} />
      )}
      {tab === "guests" && (
        <GuestsTab clients={clients} />
      )}
    </div>
  );
}

// ── Reservations Tab with Table Turn Logic ──

function ReservationsTab({ bookings, tables, today, slotDuration }: {
  bookings: Booking[]; tables: RestaurantTable[]; today: string; slotDuration: number;
}) {
  const todaysBookings = bookings.filter(b => b.booking_date === today);
  const upcomingBookings = bookings.filter(b => b.booking_date > today);
  const activeTables = tables.filter(t => t.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const zones = [...new Set(activeTables.map(t => t.zone || "Main"))];

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  function getTableStatus(table: RestaurantTable) {
    const tableBookings = todaysBookings.filter(b =>
      b.table_id === table.id && (b.status === "confirmed" || b.status === "seated")
    ).sort((a, b) => timeToMins(a.booking_time) - timeToMins(b.booking_time));

    const current = tableBookings.find(b => {
      const start = timeToMins(b.booking_time);
      const end = start + (b.duration_minutes || slotDuration);
      return nowMins >= start && nowMins < end;
    });

    const next = tableBookings.find(b => {
      const start = timeToMins(b.booking_time);
      return start > nowMins;
    });

    if (current) {
      const end = timeToMins(current.booking_time) + (current.duration_minutes || slotDuration);
      const minsLeft = end - nowMins;
      return {
        status: minsLeft <= 15 ? "turning" as const : "occupied" as const,
        booking: current,
        minsLeft,
        next,
      };
    }

    if (next) {
      const minsUntil = timeToMins(next.booking_time) - nowMins;
      return {
        status: minsUntil <= 30 ? "upcoming" as const : "open" as const,
        booking: null,
        minsLeft: 0,
        next,
      };
    }

    return { status: "open" as const, booking: null, minsLeft: 0, next: null };
  }

  return (
    <div>
      {/* Floor view */}
      <div className="mb-10">
        <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-4">Floor — Right Now</h3>
        {zones.map(zone => {
          const zoneTables = activeTables.filter(t => (t.zone || "Main") === zone);
          return (
            <div key={zone} className="mb-6">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">{zone}</div>
              <div className="flex gap-2 flex-wrap">
                {zoneTables.map(table => {
                  const ts = getTableStatus(table);
                  const colors = {
                    open: "border-emerald-300 bg-emerald-50 text-emerald-700",
                    occupied: "border-rose-300 bg-rose-50 text-rose-700",
                    turning: "border-amber-300 bg-amber-50 text-amber-700",
                    upcoming: "border-blue-200 bg-blue-50 text-blue-700",
                  };
                  return (
                    <div key={table.id} className={`border rounded-lg px-4 py-3 min-w-[100px] ${colors[ts.status]}`}>
                      <div className="text-sm font-bold">{table.name}</div>
                      <div className="text-xs mt-0.5">{table.capacity} seats</div>
                      <div className="text-[10px] font-semibold mt-1 uppercase">
                        {ts.status === "open" && "OPEN"}
                        {ts.status === "occupied" && `${ts.minsLeft}m left`}
                        {ts.status === "turning" && `TURNING — ${ts.minsLeft}m`}
                        {ts.status === "upcoming" && `Next: ${formatTime(ts.next!.booking_time)}`}
                      </div>
                      {ts.booking && (
                        <div className="text-[10px] mt-0.5 truncate">{ts.booking.clients?.name} · {ts.booking.party_size}p</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="flex gap-4 text-xs text-neutral-500 mt-4">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200" /> Open</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-200" /> Occupied</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200" /> Turning (15m or less)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200" /> Next booking within 30m</span>
        </div>
      </div>

      {/* Today's bookings with actions */}
      {todaysBookings.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-3">Today</h3>
          <BookingTable bookings={todaysBookings} tables={activeTables} showActions />
        </div>
      )}

      {upcomingBookings.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-3">Upcoming</h3>
          <BookingTable bookings={upcomingBookings} tables={activeTables} showActions={false} />
        </div>
      )}

      {todaysBookings.length === 0 && upcomingBookings.length === 0 && (
        <p className="text-sm text-neutral-400 py-8 text-center">No bookings yet.</p>
      )}
    </div>
  );
}

function BookingTable({ bookings, tables, showActions }: { bookings: Booking[]; tables: RestaurantTable[]; showActions: boolean }) {
  return (
    <div className="border border-neutral-200 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Time</th>
            <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Guest</th>
            <th className="px-4 py-2.5 text-right font-semibold text-neutral-600">Party</th>
            <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Table</th>
            <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Status</th>
            <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Notes</th>
            <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Date</th>
            {showActions && <th className="px-4 py-2.5 text-right font-semibold text-neutral-600">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => {
            const tableName = tables.find(t => t.id === b.table_id)?.name;
            return (
              <tr key={b.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 tabular-nums font-medium text-neutral-900">{formatTime(b.booking_time)}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-neutral-900">{b.clients?.name ?? "—"}</div>
                  <div className="text-xs text-neutral-400">{b.clients?.email}</div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-700">{b.party_size}</td>
                <td className="px-4 py-3 text-neutral-600">{tableName ?? "Unassigned"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3 text-neutral-500 max-w-[200px] truncate">{b.notes || "—"}</td>
                <td className="px-4 py-3 text-neutral-500 tabular-nums">
                  {new Date(b.booking_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
                {showActions && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.status === "confirmed" && (
                        <ActionBtn label="Seat" onClick={() => seatBooking(b.id).then(() => location.reload())} color="emerald" />
                      )}
                      {b.status === "seated" && (
                        <ActionBtn label="Complete" onClick={() => completeBooking(b.id).then(() => location.reload())} color="blue" />
                      )}
                      {(b.status === "confirmed" || b.status === "seated") && (
                        <>
                          <ActionBtn label="No-show" onClick={() => noShowBooking(b.id).then(() => location.reload())} color="amber" />
                          <ActionBtn label="Cancel" onClick={() => cancelBooking(b.id).then(() => location.reload())} color="rose" />
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
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

function SiteTab({ business, hours }: { business: Business; hours: Hour[] }) {
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

function GuestsTab({ clients }: { clients: BizClient[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c =>
      c.clients?.name.toLowerCase().includes(q) ||
      c.clients?.email.toLowerCase().includes(q) ||
      c.clients?.phone?.toLowerCase().includes(q) ||
      c.tags?.some(t => t.toLowerCase().includes(q)) ||
      c.dietary?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div>
      <div className="mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, tags..."
          className="w-full max-w-md rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10" />
      </div>
      <div className="text-sm text-neutral-500 mb-3">{filtered.length} guests</div>
      <div className="border border-neutral-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Name</th>
              <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Email</th>
              <th className="px-4 py-2.5 text-right font-semibold text-neutral-600">Visits</th>
              <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Last Visit</th>
              <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Tags</th>
              <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Dietary</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">{search ? "No guests match." : "No guests yet."}</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-neutral-900">{c.clients?.name ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-500">{c.clients?.email ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-700">{c.visit_count}</td>
                <td className="px-4 py-3 text-neutral-500 tabular-nums">
                  {c.last_visit ? new Date(c.last_visit).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                </td>
                <td className="px-4 py-3">
                  {c.tags?.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600">{t}</span>)}
                    </div>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-neutral-500">{c.dietary || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
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
