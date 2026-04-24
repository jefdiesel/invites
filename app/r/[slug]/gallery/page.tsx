import { getBusiness, getBusinessPhotos } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { getThemeVars } from "@/lib/theme-helpers";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const { t, displayFont, bodyFont, rCard } = getThemeVars(theme);
  const hasReservations = !!(biz as Record<string, unknown>).has_reservations;

  const allPhotos = await getBusinessPhotos(biz.id);

  const categories = [...new Set(allPhotos.map((p) => p.category))];
  const grouped = categories.map((cat) => ({
    category: cat,
    label: cat === "food" ? "Food & Drink" : cat === "interior" ? "Interior" : cat === "team" ? "Our Team" : cat === "about" ? "About" : "Gallery",
    photos: allPhotos.filter((p) => p.category === cat),
  }));

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen flex flex-col">
      <ThemeFonts theme={theme} />
      <SiteNav biz={biz} slug={slug} theme={theme} currentPage="gallery" hasReservations={hasReservations} />

      <main id="main" className="max-w-5xl mx-auto px-6 flex-1 w-full">
        <header className="pt-16 md:pt-24 pb-12">
          <h1 style={{ fontFamily: displayFont, color: t.text }} className="text-4xl md:text-5xl">
            Gallery
          </h1>
        </header>

        {allPhotos.length === 0 ? (
          <div className="pb-24 text-center">
            <p className="text-lg" style={{ color: t.textLight }}>Photos coming soon.</p>
          </div>
        ) : grouped.length === 1 ? (
          <div className="pb-24">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
              {allPhotos.map((photo) => (
                <figure key={photo.id} className="break-inside-avoid">
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    className="w-full"
                    loading="lazy"
                    style={{ borderRadius: rCard }}
                  />
                  {photo.caption && (
                    <figcaption className="mt-2 text-sm" style={{ color: t.textLight }}>
                      {photo.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <div className="pb-24 space-y-16">
            {grouped.map((group) => (
              <section key={group.category}>
                <h2 style={{ fontFamily: displayFont, color: t.text }} className="text-2xl mb-8">
                  {group.label}
                </h2>
                <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                  {group.photos.map((photo) => (
                    <figure key={photo.id} className="break-inside-avoid">
                      <img
                        src={photo.url}
                        alt={photo.alt}
                        className="w-full"
                        loading="lazy"
                        style={{ borderRadius: rCard }}
                      />
                      {photo.caption && (
                        <figcaption className="mt-2 text-sm" style={{ color: t.textLight }}>
                          {photo.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <SiteFooter biz={biz} slug={slug} theme={theme} />
    </div>
  );
}
