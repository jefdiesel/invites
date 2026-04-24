import { getBusiness } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { getThemeVars } from "@/lib/theme-helpers";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccessibilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const { t, displayFont, bodyFont } = getThemeVars(theme);
  const hasReservations = !!(biz as Record<string, unknown>).has_reservations;

  const year = new Date().getFullYear();

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen flex flex-col">
      <ThemeFonts theme={theme} />
      <SiteNav biz={biz} slug={slug} theme={theme} currentPage="accessibility" hasReservations={hasReservations} />

      <main id="main" className="flex-1 w-full max-w-3xl mx-auto px-6">
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
              {hasReservations && (
                <li className="flex gap-3">
                  <span style={{ color: t.accent }} className="font-bold shrink-0" aria-hidden="true">&bull;</span>
                  <span>The booking form uses proper labels, fieldsets, and error messages. Required fields are clearly marked.</span>
                </li>
              )}
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
                  <a href={`mailto:${biz.email}?subject=Accessibility%20Feedback`} className="text-base font-medium underline underline-offset-2" style={{ color: t.accent }}>
                    {biz.email}
                  </a>
                </p>
              )}
              {biz.phone && (
                <p>
                  <span className="text-sm font-medium" style={{ color: t.textLight }}>Phone: </span>
                  <a href={`tel:${biz.phone}`} className="text-base font-medium underline underline-offset-2" style={{ color: t.accent }}>
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

      <SiteFooter biz={biz} slug={slug} theme={theme} />
    </div>
  );
}
