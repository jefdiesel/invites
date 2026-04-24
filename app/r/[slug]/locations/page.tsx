import { getBusiness, getBusinessPhotos } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { getThemeVars } from "@/lib/theme-helpers";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Location = {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
};

export default async function LocationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const locations = ((biz as Record<string, unknown>).locations as Location[] | null) || [];
  if (locations.length === 0) redirect(`/r/${slug}/contact`);

  const theme = getTheme(biz.theme);
  const { t, displayFont, bodyFont, rBtn, rCard } = getThemeVars(theme);
  const hasReservations = !!(biz as Record<string, unknown>).has_reservations;
  const photos = await getBusinessPhotos(biz.id, "interior");

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen flex flex-col">
      <ThemeFonts theme={theme} />
      <SiteNav biz={biz} slug={slug} theme={theme} currentPage="locations" hasReservations={hasReservations} hasLocations={locations.length > 1} />

      <main id="main" className="flex-1 w-full max-w-4xl mx-auto px-6">
        <header className="pt-16 md:pt-24 pb-8">
          <h1 style={{ fontFamily: displayFont, color: t.text }} className="text-4xl md:text-5xl">
            Locations
          </h1>
        </header>

        <div className="pb-16 md:pb-24 space-y-12">
          {locations.map((loc, i) => {
            const locId = `location-${loc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            const fullAddress = [loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(", ");
            const mapsUrl = fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : null;
            const photo = photos[i];

            return (
              <section key={locId} id={locId} className="scroll-mt-20">
                <div className="border rounded-xl overflow-hidden" style={{ borderColor: t.border, borderRadius: rCard }}>
                  {photo && (
                    <img src={photo.url} alt={photo.alt} className="w-full h-48 md:h-64 object-cover" loading="lazy" />
                  )}
                  <div className="p-6 md:p-8">
                    <h2 style={{ fontFamily: displayFont, color: t.text }} className="text-2xl mb-4">
                      {loc.name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        {loc.address && (
                          <div>
                            <p className="text-base font-medium" style={{ color: t.text }}>{loc.address}</p>
                            <p className="text-sm" style={{ color: t.textMuted }}>
                              {[loc.city, loc.state, loc.zip].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}
                        {mapsUrl && (
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-block text-sm font-medium underline underline-offset-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{ color: t.accent }}>
                            Get Directions
                          </a>
                        )}
                      </div>
                      <div className="space-y-3">
                        {loc.phone && (
                          <div>
                            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: t.textLight }}>Phone</div>
                            <a href={`tel:${loc.phone}`} className="text-base font-medium underline underline-offset-2" style={{ color: t.text }}>
                              {loc.phone}
                            </a>
                          </div>
                        )}
                        {loc.email && (
                          <div>
                            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: t.textLight }}>Email</div>
                            <a href={`mailto:${loc.email}`} className="text-base font-medium underline underline-offset-2" style={{ color: t.text }}>
                              {loc.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <SiteFooter biz={biz} slug={slug} theme={theme} />
    </div>
  );
}
