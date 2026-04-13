import { getBusiness, getBusinessHours } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;
  const rBtn = theme.radius === "full" ? "9999px" : theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : "0.75rem";
  const rCard = theme.radius === "full" ? "1rem" : theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : "0.75rem";

  const hours = await getBusinessHours(biz.id);
  const today = new Date().getDay();

  const fullAddress = [biz.address, biz.city, biz.state, biz.zip].filter(Boolean).join(", ");
  const mapsUrl = fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : null;

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen flex flex-col">
      <ThemeFonts theme={theme} />

      {/* Nav */}
      <nav aria-label={`${biz.name} navigation`} className="sticky top-0 z-40 backdrop-blur"
        style={{ background: t.navBg, borderBottom: theme.navStyle === "light" ? `1px solid ${t.border}` : "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href={`/r/${slug}`} style={{ color: theme.navStyle === "light" ? t.text : "#fff" }}>
            <span style={{ fontFamily: displayFont }} className="text-xl">{biz.name}</span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href={`/r/${slug}`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>Home</Link>
            <Link href={`/r/${slug}/about`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>About</Link>
            <Link href={`/r/${slug}/book`} className="px-5 py-1.5 text-sm font-bold text-white transition-colors"
              style={{ background: t.accent, borderRadius: rBtn }}>Reserve</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6">
        <header className="pt-16 md:pt-24 pb-12">
          <h1 style={{ fontFamily: displayFont, color: t.text }} className="text-4xl md:text-5xl">
            Contact
          </h1>
        </header>

        <div className="pb-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* Contact info */}
          <div className="space-y-8">
            {/* Address */}
            {biz.address && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: t.textLight }}>Address</h2>
                <p className="text-lg font-medium" style={{ color: t.text }}>{biz.address}</p>
                <p className="text-base" style={{ color: t.textMuted }}>
                  {[biz.city, biz.state, biz.zip].filter(Boolean).join(", ")}
                </p>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-block mt-3 text-sm font-medium transition-colors"
                    style={{ color: t.accent }}>
                    Get Directions &rarr;
                  </a>
                )}
              </div>
            )}

            {/* Phone */}
            {biz.phone && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: t.textLight }}>Phone</h2>
                <a href={`tel:${biz.phone}`} className="text-lg font-medium transition-colors" style={{ color: t.text }}>
                  {biz.phone}
                </a>
              </div>
            )}

            {/* Email */}
            {biz.email && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: t.textLight }}>Email</h2>
                <a href={`mailto:${biz.email}`} className="text-lg font-medium transition-colors" style={{ color: t.text }}>
                  {biz.email}
                </a>
              </div>
            )}

            {/* Reserve CTA */}
            <div className="pt-4">
              <Link href={`/r/${slug}/book`}
                className="inline-block px-8 py-3.5 text-base font-bold text-white transition-colors"
                style={{ background: t.accent, borderRadius: rBtn }}>
                Reserve a Table
              </Link>
            </div>
          </div>

          {/* Hours */}
          {hours.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: t.textLight }}>Hours</h2>
              <div className="space-y-3" style={{ border: `1px solid ${t.border}`, borderRadius: rCard, padding: "1.25rem" }}>
                {hours.map((h) => {
                  const isToday = h.day_of_week === today;
                  return (
                    <div key={h.day_of_week} className="flex items-center justify-between"
                         style={{ color: isToday ? t.text : t.textMuted }}>
                      <span className={`text-sm ${isToday ? "font-semibold" : ""}`}>
                        {DAYS[h.day_of_week]}
                        {isToday && (
                          <span className="ml-2 text-[11px] font-bold text-white px-2 py-0.5 align-middle"
                                style={{ background: t.accent, borderRadius: rBtn }}>Today</span>
                        )}
                      </span>
                      {h.is_closed ? (
                        <span className="text-sm italic" style={{ color: t.textLight }}>Closed</span>
                      ) : (
                        <span className="text-sm tabular-nums font-medium">
                          {formatTime(h.open_time)} – {formatTime(h.close_time)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
