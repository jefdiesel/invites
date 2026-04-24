import { getBusiness, getBusinessHours, getMenuItems, getUpcomingBookings, getBusinessClients, getTables, getBusinessPhotos, getBookingStats, getWaitlist, getTableInventory, getAllBookings } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/app/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireAuth(slug, "admin");

  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const hasReservations = !!(biz as Record<string, unknown>).has_reservations;

  // Core data — always fetch
  const [hours, menu, photos, clients] = await Promise.all([
    getBusinessHours(biz.id),
    getMenuItems(biz.id, true),
    getBusinessPhotos(biz.id),
    getBusinessClients(biz.id),
  ]);

  // Reservation data — only fetch when enabled
  const [bookings, tables, stats, waitlist, inventory, allBookings] = hasReservations
    ? await Promise.all([
        getUpcomingBookings(biz.id, 30),
        getTables(biz.id),
        getBookingStats(biz.id, 30),
        getWaitlist(biz.id),
        getTableInventory(biz.id),
        getAllBookings(biz.id),
      ])
    : [[], [], [], [], [], []];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold">{biz.name}</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            {hasReservations && (
              <a href={`/r/${slug}/manage`} className="text-sm text-white/70 hover:text-white transition-colors">
                Floor View
              </a>
            )}
            <a href={`/r/${slug}`} className="text-sm text-white/70 hover:text-white transition-colors">
              View Site
            </a>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AdminDashboard
          business={biz}
          slug={slug}
          theme={theme}
          bookings={bookings}
          clients={clients}
          tables={tables}
          hours={hours}
          menu={menu}
          photos={photos}
          stats={stats}
          waitlist={waitlist}
          inventory={inventory}
          allBookings={allBookings}
        />
      </main>
    </div>
  );
}
