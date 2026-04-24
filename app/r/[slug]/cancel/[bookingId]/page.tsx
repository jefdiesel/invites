import { supabase } from "@/lib/db";
import { getBusiness } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { notFound, redirect } from "next/navigation";
import { CancelButton } from "./cancel-button";

export const dynamic = "force-dynamic";

export default async function CancelPage({ params }: { params: Promise<{ slug: string; bookingId: string }> }) {
  const { slug, bookingId } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  if (!(biz as Record<string, unknown>).has_reservations) {
    redirect(`/r/${slug}`);
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, clients(name, email)")
    .eq("id", bookingId)
    .eq("business_id", biz.id)
    .single();

  if (!booking) return notFound();

  const theme = getTheme(biz.theme);
  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;

  const client = booking.clients as unknown as { name: string; email: string } | null;
  const dateStr = new Date(booking.booking_date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const [h, m] = booking.booking_time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  const timeStr = m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;

  const alreadyCancelled = booking.status === "cancelled";

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen flex flex-col items-center justify-center px-6">
      <ThemeFonts theme={theme} />
      <div className="w-full max-w-md text-center">
        <h1 style={{ fontFamily: displayFont }} className="text-3xl mb-6">{biz.name}</h1>

        {alreadyCancelled ? (
          <>
            <p className="text-base mb-4" style={{ color: t.textMuted }}>
              This reservation has already been cancelled.
            </p>
            <a href={`/r/${slug}`} className="text-sm font-medium" style={{ color: t.accent }}>
              Back to {biz.name}
            </a>
          </>
        ) : (
          <>
            <div className="rounded-xl p-6 mb-6" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
              <p className="text-base font-semibold mb-1" style={{ color: t.text }}>
                {client?.name}, party of {booking.party_size}
              </p>
              <p className="text-base mb-1" style={{ color: t.text }}>{dateStr}</p>
              <p className="text-base" style={{ color: t.text }}>{timeStr}</p>
            </div>

            <p className="text-base mb-6" style={{ color: t.textMuted }}>
              Are you sure you want to cancel this reservation?
            </p>

            <CancelButton bookingId={bookingId} slug={slug} accent={t.accent} />
          </>
        )}
      </div>
    </div>
  );
}
