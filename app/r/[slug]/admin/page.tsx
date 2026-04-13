import { getBusiness, getBusinessHours, getMenuItems, getUpcomingBookings, getBusinessClients, getTables, getBusinessPhotos } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/app/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const [bookings, clients, tables, hours, menu, photos] = await Promise.all([
    getUpcomingBookings(biz.id, 14),
    getBusinessClients(biz.id),
    getTables(biz.id),
    getBusinessHours(biz.id),
    getMenuItems(biz.id),
    getBusinessPhotos(biz.id),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-base font-bold text-neutral-900">{biz.name}</span>
            <span className="text-sm text-neutral-400">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/r/${slug}`} className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors">
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
        />
      </main>
    </div>
  );
}
