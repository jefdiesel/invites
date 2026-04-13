import { getBusiness } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookingForm } from "@/app/components/booking-form";

export const dynamic = "force-dynamic";

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;
  const rBtn = theme.radius === "full" ? "9999px" : theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : "0.75rem";

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
        <div className="max-w-lg mx-auto px-6 py-12 md:py-16">
          <h1 style={{ fontFamily: displayFont, color: t.text }} className="text-3xl md:text-4xl mb-2">
            Reserve a Table
          </h1>
          <p className="text-sm mb-10" style={{ color: t.textMuted }}>
            {biz.min_party_size}–{biz.max_party_size} guests · Book up to {biz.booking_window_days} days ahead
          </p>
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
