import { getBusiness, getBusinessHours } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { getThemeVars, formatTime } from "@/lib/theme-helpers";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const { t, displayFont, bodyFont, rBtn, rCard } = getThemeVars(theme);
  const hasReservations = !!(biz as Record<string, unknown>).has_reservations;

  const hours = await getBusinessHours(biz.id);
  const today = new Date().getDay();

  const fullAddress = [biz.address, biz.city, biz.state, biz.zip].filter(Boolean).join(", ");
  const mapsUrl = fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : null;

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen flex flex-col">
      <ThemeFonts theme={theme} />
      <SiteNav biz={biz} slug={slug} theme={theme} currentPage="contact" hasReservations={hasReservations} hasLocations={((biz as Record<string,unknown>).locations as unknown[] || []).length > 1} />

      <main id="main" className="flex-1 w-full max-w-4xl mx-auto px-6">
        <header className="pt-16 md:pt-24 pb-12">
          <h1 style={{ fontFamily: displayFont, color: t.text }} className="text-4xl md:text-5xl">
            Contact
          </h1>
        </header>

        <div className="pb-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* Contact info */}
          <div className="space-y-8">
            {biz.address && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: t.textLight }}>Address</h2>
                <p className="text-lg font-medium" style={{ color: t.text }}>{biz.address}</p>
                <p className="text-base" style={{ color: t.textMuted }}>
                  {[biz.city, biz.state, biz.zip].filter(Boolean).join(", ")}
                </p>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-block mt-3 text-sm font-medium underline underline-offset-2 transition-colors"
                    style={{ color: t.accent }}>
                    Get Directions
                  </a>
                )}
              </div>
            )}

            {biz.phone && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: t.textLight }}>Phone</h2>
                <a href={`tel:${biz.phone}`} className="text-lg font-medium underline underline-offset-2 transition-colors" style={{ color: t.text }}>
                  {biz.phone}
                </a>
              </div>
            )}

            {biz.email && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: t.textLight }}>Email</h2>
                <a href={`mailto:${biz.email}`} className="text-lg font-medium underline underline-offset-2 transition-colors" style={{ color: t.text }}>
                  {biz.email}
                </a>
              </div>
            )}

            {/* CTA */}
            <div className="pt-4">
              {hasReservations ? (
                <Link href={`/r/${slug}/book`}
                  className="inline-block px-8 py-3.5 text-base font-bold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ background: t.accent, borderRadius: rBtn }}>
                  Reserve a Table
                </Link>
              ) : mapsUrl ? (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block px-8 py-3.5 text-base font-bold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ background: t.accent, borderRadius: rBtn }}>
                  Get Directions
                </a>
              ) : null}
            </div>
          </div>

          {/* Hours */}
          {hours.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: t.textLight }}>Hours</h2>
              <div style={{ border: `1px solid ${t.border}`, borderRadius: rCard, padding: "1.25rem" }}>
                <table className="w-full">
                  <thead className="sr-only">
                    <tr><th scope="col">Day</th><th scope="col">Hours</th></tr>
                  </thead>
                  <tbody>
                    {hours.map((h) => {
                      const isToday = h.day_of_week === today;
                      return (
                        <tr key={h.day_of_week} style={{ color: isToday ? t.text : t.textMuted }}>
                          <td className={`py-1.5 text-sm ${isToday ? "font-semibold" : ""}`}>
                            {DAYS[h.day_of_week]}
                            {isToday && (
                              <span className="ml-2 text-[11px] font-bold text-white px-2 py-0.5 align-middle"
                                    style={{ background: t.accent, borderRadius: rBtn }}>Today</span>
                            )}
                          </td>
                          <td className="py-1.5 text-sm tabular-nums font-medium text-right">
                            {h.is_closed ? (
                              <span className="italic" style={{ color: t.textLight }}>Closed</span>
                            ) : (
                              <>{formatTime(h.open_time)} – {formatTime(h.close_time)}</>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter biz={biz} slug={slug} theme={theme} />
    </div>
  );
}
