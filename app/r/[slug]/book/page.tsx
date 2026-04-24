import { getBusiness } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BookingForm } from "@/app/components/booking-form";

export const dynamic = "force-dynamic";

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  if (!(biz as Record<string, unknown>).has_reservations) {
    redirect(`/r/${slug}`);
  }

  const theme = getTheme(biz.theme);
  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;
  const rBtn = theme.radius === "full" ? "9999px" : theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : "0.75rem";

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
        {/* Hero */}
        <div className={`relative overflow-hidden ${coverImg ? "h-64 md:h-80" : "h-36 md:h-44"}`}
          style={{ background: coverImg ? undefined : t.navBg }}>
          {coverImg && (
            <>
              <img src={coverImg} alt={`${biz.name}`} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.25) 100%)" }} />
            </>
          )}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
            <div className="max-w-lg mx-auto">
              <h1 style={{ fontFamily: displayFont }} className="text-3xl md:text-4xl font-bold text-white">
                Reserve a Table
              </h1>
              <p className="text-base text-white/60 mt-1">{biz.name}{biz.cuisine ? ` · ${biz.cuisine}` : ""}</p>
            </div>
          </div>
        </div>

        {/* Floating card */}
        <div className="max-w-lg mx-auto px-6 -mt-5 relative z-10 pb-16">
          <div className="rounded-2xl overflow-hidden" style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          }}>
            {biz.is_live === false ? (
              <div className="px-6 py-10 text-center">
                <p className="text-lg font-semibold mb-2" style={{ color: t.text }}>Coming Soon</p>
                <p className="text-sm mb-6" style={{ color: t.textMuted }}>
                  Online reservations aren't open yet.
                </p>
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="inline-block text-sm font-bold px-6 py-3 rounded-lg"
                    style={{ background: t.accent, color: "#fff", borderRadius: rBtn }}>
                    Call {biz.phone}
                  </a>
                )}
              </div>
            ) : (
              <div className="px-6 py-6">
                <BookingForm
                  businessId={biz.id}
                  slug={slug}
                  restaurantName={biz.name}
                  minParty={biz.min_party_size}
                  maxParty={biz.max_party_size}
                  windowDays={biz.booking_window_days}
                  phone={biz.phone}
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
              </div>
            )}
          </div>
        </div>
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
