import { getBusiness, getTodaysBookings } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { getGuestSession } from "@/lib/guest-auth";
import { notFound } from "next/navigation";
import { CheckinPage } from "@/app/components/checkin-page";

export const dynamic = "force-dynamic";

export default async function CheckinRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;

  const qrWaitlist = (biz as Record<string, unknown>).qr_waitlist_enabled as boolean ?? false;
  const qrCheckin = (biz as Record<string, unknown>).qr_checkin_enabled as boolean ?? false;

  // If neither enabled, show a message
  if (!qrWaitlist && !qrCheckin) {
    return (
      <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen flex items-center justify-center px-6">
        <ThemeFonts theme={theme} />
        <div className="text-center">
          <h1 style={{ fontFamily: displayFont }} className="text-2xl font-bold mb-2">{biz.name}</h1>
          <p className="text-base" style={{ color: t.textMuted }}>Check-in is not available right now.</p>
        </div>
      </div>
    );
  }

  // Check for logged-in guest with today's reservation
  const session = await getGuestSession();
  let guestReservation = null;
  if (session && qrCheckin) {
    const todayBookings = await getTodaysBookings(biz.id);
    const match = todayBookings.find(b => {
      const c = b.clients as unknown as { email: string } | null;
      return c?.email === session.email && b.status === "confirmed";
    });
    if (match) {
      guestReservation = {
        id: match.id,
        time: match.booking_time,
        partySize: match.party_size,
        name: (match.clients as unknown as { name: string })?.name ?? "Guest",
      };
    }
  }

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen">
      <ThemeFonts theme={theme} />
      <CheckinPage
        businessId={biz.id}
        businessName={biz.name}
        slug={slug}
        waitlistEnabled={qrWaitlist}
        checkinEnabled={qrCheckin}
        guestReservation={guestReservation}
        theme={{ accent: t.accent, text: t.text, textMuted: t.textMuted, bg: t.bg, surface: t.surface, border: t.border, displayFont }}
      />
    </div>
  );
}
