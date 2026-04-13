import { getBusiness, getBusinessPhotos } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;
  const rBtn = theme.radius === "full" ? "9999px" : theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : "0.75rem";
  const rCard = theme.radius === "full" ? "1rem" : theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : "0.75rem";

  const allPhotos = await getBusinessPhotos(biz.id);

  // Group by category
  const categories = [...new Set(allPhotos.map((p) => p.category))];
  const grouped = categories.map((cat) => ({
    category: cat,
    label: cat === "food" ? "Food & Drink" : cat === "interior" ? "Interior" : cat === "team" ? "Our Team" : cat === "about" ? "About" : "Gallery",
    photos: allPhotos.filter((p) => p.category === cat),
  }));

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
            <Link href={`/r/${slug}#menu`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>Menu</Link>
            <Link href={`/r/${slug}/about`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>About</Link>
            <Link href={`/r/${slug}/gallery`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navTextHover }}>Gallery</Link>
            <Link href={`/r/${slug}/contact`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>Contact</Link>
            <Link href={`/r/${slug}/book`} className="px-5 py-1.5 text-sm font-bold text-white transition-colors"
              style={{ background: t.accent, borderRadius: rBtn }}>Reserve</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 flex-1 w-full">
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
          /* Single category: just show the grid */
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
          /* Multiple categories: section per category */
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
            <Link href={`/r/${slug}/contact`} className="opacity-60 hover:opacity-100 transition-opacity">Contact</Link>
            <Link href={`/r/${slug}/accessibility`} className="opacity-60 hover:opacity-100 transition-opacity">Accessibility</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
