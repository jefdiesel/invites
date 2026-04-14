import { getBusiness, getBusinessHours } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookingForm } from "@/app/components/booking-form";

export const dynamic = "force-dynamic";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;
  const rBtn = theme.radius === "full" ? "9999px" : theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : "0.75rem";

  const hours = await getBusinessHours(biz.id);
  const openDays = hours.filter(h => !h.is_closed).sort((a, b) => a.day_of_week - b.day_of_week);

  // Group consecutive days with same hours
  function formatHoursSummary() {
    if (openDays.length === 0) return null;
    const groups: { days: number[]; open: string; close: string }[] = [];
    for (const h of openDays) {
      const last = groups[groups.length - 1];
      if (last && last.open === h.open_time && last.close === h.close_time &&
        last.days[last.days.length - 1] === h.day_of_week - 1) {
        last.days.push(h.day_of_week);
      } else {
        groups.push({ days: [h.day_of_week], open: h.open_time, close: h.close_time });
      }
    }
    return groups.map(g => {
      const dayStr = g.days.length === 1
        ? DAYS[g.days[0]]
        : `${DAYS[g.days[0]]}–${DAYS[g.days[g.days.length - 1]]}`;
      return `${dayStr} ${fmtTime(g.open)}–${fmtTime(g.close)}`;
    }).join(" · ");
  }

  const coverImg = biz.cover_image_url;

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen flex flex-col">
      <ThemeFonts theme={theme} />

      {/* Nav */}
      <nav aria-label={`${biz.name} navigation`} className="sticky top-0 z-40 backdrop-blur"
        style={{ background: t.navBg, borderBottom: theme.navStyle === "light" ? `1px solid ${t.border}` : "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href={`/r/${slug}`} className="flex items-center gap-3"
            style={{ color: theme.navStyle === "light" ? t.text : "#fff" }}>
            <span style={{ fontFamily: displayFont }} className="text-xl">{biz.name}</span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href={`/r/${slug}#menu`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>Menu</Link>
            <Link href={`/r/${slug}/about`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>About</Link>
            <Link href={`/r/${slug}/gallery`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>Gallery</Link>
            <Link href={`/r/${slug}/contact`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>Contact</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full">
        {/* Hero with cover image */}
        {coverImg && (
          <div className="relative h-56 md:h-72 overflow-hidden">
            <img src={coverImg} alt={`${biz.name} dining room`} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.3) 100%)" }} />
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
              <div className="max-w-lg mx-auto">
                <h1 style={{ fontFamily: displayFont }} className="text-3xl md:text-4xl font-bold text-white mb-1" >
                  Reserve a Table
                </h1>
                <p className="text-sm text-white/70">{biz.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Booking card */}
        <div className={`max-w-lg mx-auto px-6 ${coverImg ? "-mt-6 relative z-10" : "pt-12"}`}>
          <div className="rounded-2xl overflow-hidden" style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            boxShadow: coverImg ? "0 4px 24px rgba(0,0,0,0.12)" : "none",
          }}>
            {/* Restaurant info strip */}
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${t.border}` }}>
              {!coverImg && (
                <h1 style={{ fontFamily: displayFont, color: t.text }} className="text-2xl md:text-3xl mb-3">
                  Reserve a Table
                </h1>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: t.textMuted }}>
                <span>{biz.min_party_size}–{biz.max_party_size} guests</span>
                {biz.cuisine && <span>· {biz.cuisine}</span>}
                {biz.price_range && <span>· {biz.price_range}</span>}
              </div>
              {formatHoursSummary() && (
                <div className="text-xs mt-2" style={{ color: t.textLight }}>
                  {formatHoursSummary()}
                </div>
              )}
            </div>

            {/* Booking form or coming soon */}
            <div className="px-6 py-6">
              {biz.is_live === false ? (
                <>
                  <p className="text-base font-semibold mb-2" style={{ color: t.text }}>Coming Soon</p>
                  <p className="text-sm mb-4" style={{ color: t.textMuted }}>
                    Online reservations aren't open yet. Check back soon or contact us directly.
                  </p>
                  {biz.phone && (
                    <a href={`tel:${biz.phone}`} className="inline-block text-sm font-bold px-5 py-2.5 rounded-lg"
                      style={{ background: t.accent, color: "#fff", borderRadius: rBtn }}>
                      Call {biz.phone}
                    </a>
                  )}
                </>
              ) : (
                <BookingForm
                  businessId={biz.id}
                  slug={slug}
                  minParty={biz.min_party_size}
                  maxParty={biz.max_party_size}
                  windowDays={biz.booking_window_days}
                  theme={{
                    accent: t.accent,
                    accentHover: t.accentHover,
                    text: t.text,
                    textMuted: t.textMuted,
                    textLight: t.textLight,
                    bg: t.bg,
                    surface: t.surface,
                    border: t.border,
                    radius: rBtn,
                    displayFont,
                  }}
                />
              )}
            </div>

            {/* Allergy notice */}
            <div className="px-6 pb-5">
              <div className="rounded-lg px-4 py-3 text-xs" style={{ background: `${t.accent}08`, color: t.textMuted }}>
                <strong style={{ color: t.text }}>Food allergies?</strong> Let us know in the special requests field when booking, or call ahead at{" "}
                {biz.phone ? <a href={`tel:${biz.phone}`} className="underline" style={{ color: t.accent }}>{biz.phone}</a> : "the restaurant"}.
                We take allergies seriously and will do our best to accommodate.
              </div>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-16" />
      </main>

      <footer style={{ background: t.footerBg, borderTop: "1px solid rgba(255,255,255,0.1)" }} className="py-10 mt-auto">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <span style={{ fontFamily: displayFont, color: t.footerText }} className="text-lg">{biz.name}</span>
            <div className="flex items-center gap-4 text-sm" style={{ color: t.footerText }}>
              {biz.phone && <a href={`tel:${biz.phone}`} className="opacity-70 hover:opacity-100 transition-opacity">{biz.phone}</a>}
              {biz.email && <a href={`mailto:${biz.email}`} className="opacity-70 hover:opacity-100 transition-opacity">{biz.email}</a>}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs" style={{ color: t.footerText }}>
            <Link href={`/r/${slug}/about`} className="opacity-60 hover:opacity-100 transition-opacity">About</Link>
            <Link href={`/r/${slug}/gallery`} className="opacity-60 hover:opacity-100 transition-opacity">Gallery</Link>
            <Link href={`/r/${slug}/contact`} className="opacity-60 hover:opacity-100 transition-opacity">Contact</Link>
            <Link href={`/r/${slug}/accessibility`} className="opacity-60 hover:opacity-100 transition-opacity">Accessibility</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
