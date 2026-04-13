import Link from "next/link";

export const metadata = {
  title: "Accessibility — Remi",
  description: "Remi's commitment to web accessibility. WCAG 2.2 AA compliance across all restaurant websites we build.",
};

export default function AccessibilityPage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-display)] text-2xl text-neutral-900">Remi</Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/#features" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium hidden md:inline">Features</Link>
            <Link href="/themes" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium hidden md:inline">Themes</Link>
            <Link href="/#pricing" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium hidden md:inline">Pricing</Link>
            <Link href="/themes" className="rounded-full bg-neutral-900 text-white px-5 py-2 font-bold hover:bg-neutral-700 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6">
        <header className="pt-16 md:pt-24 pb-8">
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-neutral-900">
            Accessibility
          </h1>
          <p className="text-lg text-neutral-500 mt-4 max-w-2xl leading-relaxed">
            Accessibility is not a feature we bolt on — it is how we build. Every restaurant website on Remi meets WCAG 2.2 Level AA standards, and we hold ourselves to the same standard.
          </p>
        </header>

        <article className="pb-24 space-y-12">

          {/* Our commitment */}
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-neutral-900 mb-4">Our commitment</h2>
            <p className="text-base text-neutral-600 leading-relaxed mb-4">
              Remi believes the web should be usable by everyone. We design and build every page — both this marketing site and the restaurant websites we power — to be perceivable, operable, understandable, and robust for all users, including people who rely on assistive technology.
            </p>
            <p className="text-base text-neutral-600 leading-relaxed">
              We target conformance with the <strong>Web Content Accessibility Guidelines (WCAG) 2.2 Level AA</strong> published by the World Wide Web Consortium (W3C). This is the standard referenced by the Americans with Disabilities Act (ADA), Section 508, the European Accessibility Act (EAA), and the Accessibility for Ontarians with Disabilities Act (AODA).
            </p>
          </section>

          {/* What we do on this site */}
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-neutral-900 mb-4">What we do on this site</h2>
            <ul className="space-y-3 text-base text-neutral-600 leading-relaxed">
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>Semantic HTML throughout — headings, landmarks, lists, and links used correctly so assistive technology can navigate the page structure.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>All text meets WCAG 2.2 contrast ratios: minimum 4.5:1 for body text, 3:1 for large text and UI components.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>Keyboard navigation works across the entire site. Focus indicators are visible on all interactive elements.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>All images include descriptive alt text. Decorative images are marked with empty alt attributes so screen readers skip them.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>No information is conveyed by color alone. Status indicators, dietary labels, and interactive states use text, shape, or position in addition to color.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>The site works at 200% browser zoom without loss of content or functionality.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>No auto-playing media, no flashing content, no time-limited interactions.</span></li>
            </ul>
          </section>

          {/* What we build for restaurants */}
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-neutral-900 mb-4">What we build for every restaurant</h2>
            <p className="text-base text-neutral-600 leading-relaxed mb-4">
              Every restaurant website built on Remi includes these accessibility features by default. They cannot be turned off.
            </p>
            <ul className="space-y-3 text-base text-neutral-600 leading-relaxed">
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span><strong>Skip-to-content link</strong> on every page, visible on keyboard focus, allowing users to bypass navigation.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span><strong>Alt text enforced at the database level.</strong> Photos cannot be uploaded without descriptive alt text. This is a hard constraint, not a suggestion.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span><strong>Contrast-safe text over images.</strong> Hero sections use gradient overlays and CSS text shadows to guarantee readability regardless of the background image.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span><strong>Accessible booking forms.</strong> Every form field has a visible label (not placeholder-only). Required fields are marked. Error messages identify the problem and suggest a fix. Form state is preserved on error.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span><strong>Dietary information uses text and color.</strong> Menu items show dietary flags (V, VG, GF, DF) with both colored badges and full-text labels, so meaning is never color-dependent.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span><strong>ARIA landmarks and heading hierarchy.</strong> Every page uses proper semantic structure: nav, main, article, section, figure. Screen readers can navigate by heading level.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span><strong>Keyboard-operable interactions.</strong> Every button, link, and form control is reachable and operable via keyboard. No mouse-only interactions.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span><strong>Responsive at all zoom levels.</strong> Sites reflow correctly at 200% zoom. Touch targets meet the 44x44px minimum.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span><strong>Dedicated accessibility page.</strong> Every restaurant site includes a public accessibility statement with contact information for reporting barriers.</span></li>
            </ul>
          </section>

          {/* Legal landscape */}
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-neutral-900 mb-4">Legal landscape</h2>
            <p className="text-base text-neutral-600 leading-relaxed mb-4">
              Web accessibility is increasingly a legal requirement, not just a best practice. Restaurants with inaccessible websites face real legal risk.
            </p>
            <div className="space-y-6">
              <div className="border border-neutral-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-neutral-900 mb-2">United States — ADA Title III</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  The Americans with Disabilities Act requires places of public accommodation — including restaurants — to provide equal access. Federal courts have consistently held that websites are covered under Title III. ADA website lawsuits have increased year over year, with over 4,000 filed in 2023 alone. The DOJ has stated that WCAG 2.1 AA is the expected standard.
                </p>
              </div>
              <div className="border border-neutral-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-neutral-900 mb-2">California — Unruh Civil Rights Act</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  California's Unruh Act provides a private right of action with statutory damages of $4,000 per violation. An ADA violation is automatically an Unruh violation. California accounts for the majority of web accessibility lawsuits in the US.
                </p>
              </div>
              <div className="border border-neutral-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-neutral-900 mb-2">European Union — European Accessibility Act</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  The EAA (Directive 2019/882) requires digital services to meet EN 301 549 (based on WCAG 2.1 AA) by June 2025. Member states set their own enforcement and penalties.
                </p>
              </div>
              <div className="border border-neutral-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-neutral-900 mb-2">Canada — AODA &amp; ACA</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Ontario's AODA requires WCAG 2.0 AA for organizations with 50+ employees. The federal Accessible Canada Act (ACA) extends requirements nationally for federally regulated entities. Fines up to $250,000.
                </p>
              </div>
            </div>
            <p className="text-base text-neutral-600 leading-relaxed mt-6">
              <strong>Remi handles this for you.</strong> Every site we build meets WCAG 2.2 AA — the most current standard — out of the box. You don't need to hire an accessibility consultant or worry about compliance. It's built into the platform.
            </p>
          </section>

          {/* Testing */}
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-neutral-900 mb-4">How we test</h2>
            <ul className="space-y-3 text-base text-neutral-600 leading-relaxed">
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>Automated scanning with axe-core on every theme and page type.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>Manual testing with VoiceOver (macOS/iOS) and NVDA (Windows).</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>Keyboard-only navigation testing across all flows (browse, book, contact).</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>Color contrast verification with WCAG contrast checker tools.</span></li>
              <li className="flex gap-3"><span className="text-neutral-900 font-bold shrink-0" aria-hidden="true">&bull;</span><span>Responsive testing at 200% zoom on desktop and mobile viewports.</span></li>
            </ul>
          </section>

          {/* Feedback */}
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-neutral-900 mb-4">Report a barrier</h2>
            <p className="text-base text-neutral-600 leading-relaxed mb-4">
              If you encounter an accessibility barrier on this site or any restaurant site powered by Remi, we want to know. We take every report seriously and will work to resolve issues promptly.
            </p>
            <p className="text-base text-neutral-600">
              Email: <a href="mailto:accessibility@itsremi.app" className="font-medium text-neutral-900 underline">accessibility@itsremi.app</a>
            </p>
          </section>

          <p className="text-sm text-neutral-400 pt-4">
            Last updated: {year}
          </p>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-[family-name:var(--font-display)] text-xl text-neutral-900">Remi</span>
          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <a href="/#features" className="hover:text-neutral-900 transition-colors">Features</a>
            <Link href="/themes" className="hover:text-neutral-900 transition-colors">Themes</Link>
            <a href="/#pricing" className="hover:text-neutral-900 transition-colors">Pricing</a>
            <Link href="/accessibility" className="text-neutral-900 font-medium">Accessibility</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
