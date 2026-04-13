import { getBusiness } from "@/lib/restaurant-queries";
import { notFound } from "next/navigation";
import { BookingForm } from "@/app/components/booking-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="bg-white border-b border-warm-200">
        <div className="max-w-lg mx-auto px-6 h-14 flex items-center justify-between">
          <Link href={`/r/${slug}`} className="text-base font-bold text-warm-900">{biz.name}</Link>
          <Link href={`/r/${slug}`} className="text-sm text-warm-500 hover:text-warm-700 transition-colors">&larr; Back</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Reserve a Table</h1>
        <p className="text-sm text-warm-500 mb-8">
          {biz.min_party_size}–{biz.max_party_size} guests · Book up to {biz.booking_window_days} days ahead
        </p>
        <BookingForm
          businessId={biz.id}
          slug={slug}
          minParty={biz.min_party_size}
          maxParty={biz.max_party_size}
          windowDays={biz.booking_window_days}
        />
      </main>
    </div>
  );
}
