import { getBusiness, getBusinessPhotos } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;
  const rBtn = theme.radius === "full" ? "9999px" : theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : "0.75rem";
  const rCard = theme.radius === "full" ? "1rem" : theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : "0.75rem";

  const aboutPhotos = await getBusinessPhotos(biz.id, "about");
  const teamPhotos = await getBusinessPhotos(biz.id, "team");

  // Split editorial into paragraphs
  const story = (biz.about_story || biz.about || "").split(/\n\n+/).filter(Boolean);
  const headline = biz.about_headline || "Our Story";

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
            <Link href={`/r/${slug}/about`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navTextHover }}>About</Link>
            <Link href={`/r/${slug}/gallery`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>Gallery</Link>
            <Link href={`/r/${slug}/contact`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>Contact</Link>
            <Link href={`/r/${slug}/book`} className="px-5 py-1.5 text-sm font-bold text-white transition-colors"
              style={{ background: t.accent, borderRadius: rBtn }}>Reserve</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6">
        {/* Header */}
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

        {/* Editorial content with inline photos — alternating left/center/right */}
        <div className="pb-16 md:pb-24">
          {story.length > 0 ? (
            <div className="space-y-10">
              {story.map((paragraph: string, i: number) => {
                // Place a photo after paragraphs 1, 3, 5 (indices 1, 3, 5)
                const photoSlotIndex = Math.floor((i - 1) / 2);
                const showPhoto = i > 0 && i % 2 === 1 && aboutPhotos[photoSlotIndex];
                const photo = showPhoto ? aboutPhotos[photoSlotIndex] : null;
                // Alternate: 0=left-aligned, 1=full-width center, 2=right-aligned
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
            /* No editorial — show the short about + any photos */
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

          {/* Team section */}
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
          <Link href={`/r/${slug}/book`}
            className="inline-block px-10 py-4 text-lg font-bold text-white transition-colors"
            style={{ background: t.accent, borderRadius: rBtn }}>
            Reserve a Table
          </Link>
        </section>
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
