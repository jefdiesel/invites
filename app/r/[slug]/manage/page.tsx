import { getBusiness, getUpcomingBookings, getTables, getWaitlist } from "@/lib/restaurant-queries";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ManageView } from "@/app/components/manage-view";

export const dynamic = "force-dynamic";

export default async function ManagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireAuth(slug, "staff");

  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const [bookings, tables, waitlist] = await Promise.all([
    getUpcomingBookings(biz.id, 1),
    getTables(biz.id),
    getWaitlist(biz.id),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold">{biz.name}</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {session.role === "admin" ? "Admin" : "Staff"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {session.role === "admin" && (
              <a href={`/r/${slug}/admin`} className="text-sm text-white/70 hover:text-white transition-colors">
                Full Admin
              </a>
            )}
            <a href={`/r/${slug}`} className="text-sm text-white/70 hover:text-white transition-colors">
              View Site
            </a>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <ManageView
          businessId={biz.id}
          businessName={biz.name}
          slug={slug}
          bookings={bookings}
          tables={tables}
          slotDuration={biz.slot_duration_minutes}
          waitlist={waitlist}
        />
      </main>
    </div>
  );
}
