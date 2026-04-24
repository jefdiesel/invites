import { getBusiness, getBusinessPhotos } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { getThemeVars } from "@/lib/theme-helpers";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const { t, displayFont, bodyFont, rBtn, rCard } = getThemeVars(theme);
  const hasReservations = !!(biz as Record<string, unknown>).has_reservations;

  const aboutPhotos = await getBusinessPhotos(biz.id, "about");
  const teamPhotos = await getBusinessPhotos(biz.id, "team");

  const story = (biz.about_story || biz.about || "").split(/\n\n+/).filter(Boolean);
  const headline = biz.about_headline || "Our Story";

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen flex flex-col">
      <ThemeFonts theme={theme} />
      <SiteNav biz={biz} slug={slug} theme={theme} currentPage="about" hasReservations={hasReservations} />

      <main id="main" className="flex-1 w-full max-w-4xl mx-auto px-6">
        <header className="pt-16 md:pt-24 pb-12">
          <h1 style={{ fontFamily: displayFont, color: t.text }} className="text-4xl md:text-5xl mb-4">
            {headline}
          </h1>
          {biz.cuisine && (
            <p className="text-sm tracking-widest uppercase" style={{ color: t.textLight }}>
              {[biz.cuisine, biz.price_range].filter(Boolean).join(" · ")}
            </p>
          )}
        </header>

        <div className="pb-16 md:pb-24">
          {story.length > 0 ? (
            <div className="space-y-10">
              {story.map((paragraph: string, i: number) => {
                const photoSlotIndex = Math.floor((i - 1) / 2);
                const showPhoto = i > 0 && i % 2 === 1 && aboutPhotos[photoSlotIndex];
                const photo = showPhoto ? aboutPhotos[photoSlotIndex] : null;
                const photoLayout = photoSlotIndex % 3;

                return (
                  <div key={i}>
                    <p className="text-lg leading-relaxed max-w-2xl" style={{ color: t.textMuted }}>
                      {paragraph}
                    </p>

                    {photo && (
                      <figure className={`mt-10 mb-2 ${
                        photoLayout === 0 ? "md:w-3/5 md:mr-auto" :
                        photoLayout === 1 ? "w-full" :
                        "md:w-3/5 md:ml-auto"
                      }`}>
                        <img
                          src={photo.url}
                          alt={photo.alt}
                          className="w-full object-cover"
                          loading="lazy"
                          style={{ borderRadius: rCard, maxHeight: photoLayout === 1 ? "480px" : "360px" }}
                        />
                        {photo.caption && (
                          <figcaption className="mt-3 text-sm" style={{ color: t.textMuted }}>
                            {photo.caption}
                          </figcaption>
                        )}
                      </figure>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {biz.about && (
                <p className="text-lg leading-relaxed max-w-2xl mb-8" style={{ color: t.textMuted }}>
                  {biz.about}
                </p>
              )}
              {aboutPhotos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aboutPhotos.map((photo) => (
                    <figure key={photo.id}>
                      <img
                        src={photo.url}
                        alt={photo.alt}
                        className="w-full object-cover"
                        style={{ borderRadius: theme.radius === "none" ? "0" : "0.5rem", maxHeight: "300px" }}
                      />
                      {photo.caption && (
                        <figcaption className="mt-2 text-sm italic" style={{ color: t.textLight }}>
                          {photo.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}
            </div>
          )}

          {teamPhotos.length > 0 && (
            <section className="mt-20 pt-12" style={{ borderTop: `1px solid ${t.border}` }}>
              <h2 style={{ fontFamily: displayFont, color: t.text }} className="text-3xl mb-10">The Team</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {teamPhotos.map((photo) => (
                  <figure key={photo.id} className="text-center">
                    <img
                      src={photo.url}
                      alt={photo.alt}
                      className="w-full aspect-square object-cover mx-auto"
                      style={{ borderRadius: theme.radius === "full" ? "9999px" : theme.radius === "none" ? "0" : "0.5rem", maxWidth: "240px" }}
                    />
                    {photo.caption && (
                      <figcaption className="mt-3 text-sm font-medium" style={{ color: t.text }}>
                        {photo.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* CTA */}
        <section className="pb-20 text-center" style={{ borderTop: `1px solid ${t.border}`, paddingTop: "3rem" }}>
          {hasReservations ? (
            <Link href={`/r/${slug}/book`}
              className="inline-block px-10 py-4 text-lg font-bold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: t.accent, borderRadius: rBtn }}>
              Reserve a Table
            </Link>
          ) : (
            <Link href={`/r/${slug}/contact`}
              className="inline-block px-10 py-4 text-lg font-bold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: t.accent, borderRadius: rBtn }}>
              Contact Us
            </Link>
          )}
        </section>
      </main>

      <SiteFooter biz={biz} slug={slug} theme={theme} />
    </div>
  );
}
