import { getBusiness } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccessibilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;
  const rBtn = theme.radius === "full" ? "9999px" : theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : "0.75rem";

  const year = new Date().getFullYear();

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen">
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
            <Link href={`/r/${slug}/contact`} className="font-medium transition-colors hidden md:inline" style={{ color: t.navText }}>Contact</Link>
            <Link href={`/r/${slug}/book`} className="px-5 py-1.5 text-sm font-bold text-white transition-colors"
              style={{ background: t.accent, borderRadius: rBtn }}>Reserve</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6">
        <header className="pt-16 md:pt-24 pb-8">
          <h1 style={{ fontFamily: displayFont, color: t.text }} className="text-4xl md:text-5xl">
            Accessibility
          </h1>
        </header>

        <article className="pb-24 space-y-8">
          <p className="text-base leading-relaxed" style={{ color: t.textMuted }}>
            {biz.name} is committed to making our website accessible to all visitors, including people with disabilities. We aim to meet or exceed the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA standards.
          </p>

          <section>
            <h2 style={{ fontFamily: displayFont, color: t.text }} className="text-2xl mb-4">What we do</h2>
            <ul className="space-y-3 text-base leading-relaxed" style={{ color: t.textMuted }}>
              <li className="flex gap-3">
                <span style={{ color: t.accent }} className="font-bold shrink-0" aria-hidden="true">&bull;</span>
                <span>All images include descriptive alt text so screen readers can convey the content.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: t.accent }} className="font-bold shrink-0" aria-hidden="true">&bull;</span>
                <span>Text meets WCAG 2.2 contrast ratios: 4.5:1 for body text, 3:1 for large text. Text over images uses overlay gradients and text shadows for guaranteed readability.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: t.accent }} className="font-bold shrink-0" aria-hidden="true">&bull;</span>
                <span>The entire site is keyboard navigable. A skip-to-content link is available for keyboard users. Focus indicators are visible on all interactive elements.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: t.accent }} className="font-bold shrink-0" aria-hidden="true">&bull;</span>
                <span>Navigation uses semantic HTML landmarks and ARIA labels. Screen readers can navigate by heading, landmark, or link.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: t.accent }} className="font-bold shrink-0" aria-hidden="true">&bull;</span>
                <span>The booking form uses proper labels, fieldsets, and error messages. Required fields are clearly marked.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: t.accent }} className="font-bold shrink-0" aria-hidden="true">&bull;</span>
                <span>Dietary information uses both color and text labels so meaning is not conveyed by color alone.</span>
              </li>
              <li className="flex gap-3">
                <span style={{ color: t.accent }} className="font-bold shrink-0" aria-hidden="true">&bull;</span>
                <span>The site is fully responsive and works with screen magnification up to 200% without loss of content or function.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: displayFont, color: t.text }} className="text-2xl mb-4">Standards</h2>
            <p className="text-base leading-relaxed" style={{ color: t.textMuted }}>
              This site targets conformance with WCAG 2.2 Level AA. We test with screen readers (VoiceOver, NVDA), keyboard-only navigation, and automated accessibility tools.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: displayFont, color: t.text }} className="text-2xl mb-4">Feedback</h2>
            <p className="text-base leading-relaxed" style={{ color: t.textMuted }}>
              If you encounter an accessibility barrier on this site, please let us know. We take every report seriously and will work to fix issues promptly.
            </p>
            <div className="mt-4 space-y-2">
              {biz.email && (
                <p>
                  <span className="text-sm font-medium" style={{ color: t.textLight }}>Email: </span>
                  <a href={`mailto:${biz.email}?subject=Accessibility%20Feedback`} className="text-base font-medium" style={{ color: t.accent }}>
                    {biz.email}
                  </a>
                </p>
              )}
              {biz.phone && (
                <p>
                  <span className="text-sm font-medium" style={{ color: t.textLight }}>Phone: </span>
                  <a href={`tel:${biz.phone}`} className="text-base font-medium" style={{ color: t.accent }}>
                    {biz.phone}
                  </a>
                </p>
              )}
            </div>
          </section>

          <p className="text-sm" style={{ color: t.textLight }}>
            Last updated: {year}
          </p>
        </article>
      </main>

      <footer style={{ background: t.footerBg, borderTop: "1px solid rgba(255,255,255,0.1)" }} className="py-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span style={{ fontFamily: displayFont, color: t.footerText }} className="text-lg">{biz.name}</span>
          <div className="flex items-center gap-4 text-sm" style={{ color: t.footerTextMuted }}>
            <Link href={`/r/${slug}/contact`} className="transition-colors hover:opacity-80">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
