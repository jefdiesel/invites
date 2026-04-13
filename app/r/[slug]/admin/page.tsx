import { getBusiness, getUpcomingBookings, getBusinessClients } from "@/lib/restaurant-queries";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/app/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const bookings = await getUpcomingBookings(biz.id, 14);
  const clients = await getBusinessClients(biz.id);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-warm-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-base font-bold text-warm-900">{biz.name}</span>
            <span className="text-sm text-warm-400">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/r/${slug}`} className="rounded-lg px-3 py-1.5 text-sm text-warm-500 hover:text-warm-900 hover:bg-warm-50 transition-colors">
              View Site
            </a>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <AdminDashboard
          businessId={biz.id}
          businessName={biz.name}
          slug={slug}
          bookings={bookings}
          clients={clients}
        />
      </main>
    </div>
  );
}
