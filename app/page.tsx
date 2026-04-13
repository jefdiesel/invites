import Link from "next/link";
import { themes, type ThemeId } from "@/lib/themes";

const DEMO_SLUGS: Record<ThemeId, string> = {
  modern: "nori",
  classic: "chez-laurent",
  rustic: "copper-hen",
  playful: "bennys",
  bright: "volta",
};

const DEMO_NAMES: Record<ThemeId, string> = {
  modern: "Nori",
  classic: "Chez Laurent",
  rustic: "The Copper Hen",
  playful: "Benny's",
  bright: "Volta",
};

const DEMO_IMAGES: Record<ThemeId, string> = {
  modern: "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=1200&q=80",
  classic: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
  rustic: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&q=80",
  playful: "https://images.unsplash.com/photo-1466220549276-aef9ce186540?w=1200&q=80",
  bright: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200&q=80",
};

const DEMO_CUISINES: Record<ThemeId, string> = {
  modern: "Japanese · $$$$",
  classic: "French-American · $$$",
  rustic: "Farm-to-Table · $$",
  playful: "Burgers & Shakes · $",
  bright: "New American · $$$",
};

export default function HomePage() {
  const themeIds = Object.keys(themes) as ThemeId[];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-display)] text-2xl text-neutral-900">Remi</Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Features</a>
            <a href="#themes" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Themes</a>
            <a href="#pricing" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Pricing</a>
            <Link href="/themes" className="rounded-full bg-neutral-900 text-white px-5 py-2 font-bold hover:bg-neutral-700 transition-colors">
              Browse Themes
            </Link>
          </div>
          {/* Mobile */}
          <div className="flex md:hidden items-center gap-3">
            <a href="#pricing" className="text-sm font-medium text-neutral-500">Pricing</a>
            <Link href="/themes" className="rounded-full bg-neutral-900 text-white px-4 py-1.5 text-sm font-bold hover:bg-neutral-700 transition-colors">
              Browse Themes
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — with product showcase */}
      <header className="max-w-6xl mx-auto px-6 pt-20 pb-8 md:pt-28 md:pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl text-neutral-900 leading-[1.08] mb-6">
            Your restaurant,<br />your website
          </h1>
          <p className="text-xl md:text-2xl text-neutral-500 leading-relaxed mb-10 max-w-2xl mx-auto">
            Reservations, menu, CRM, and events — built in, not bolted on. One flat fee. Zero per-reservation charges.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/r/volta" className="rounded-full bg-neutral-900 text-white px-8 py-4 text-lg font-bold hover:bg-neutral-700 transition-colors">
              See a Live Demo
            </Link>
            <a href="#pricing" className="rounded-full border-2 border-neutral-200 text-neutral-700 px-8 py-4 text-lg font-bold hover:border-neutral-400 transition-colors">
              View Pricing
            </a>
          </div>
        </div>
      </header>

      {/* Hero product showcase — large theme previews */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Featured large card */}
          <Link href={`/r/${DEMO_SLUGS.classic}`} className="group block md:row-span-2">
            <div className="rounded-2xl overflow-hidden border border-neutral-200 group-hover:border-neutral-400 transition-all group-hover:shadow-lg h-full">
              <div className="h-full min-h-[320px] md:min-h-full relative flex items-end">
                <img src={DEMO_IMAGES.classic} alt="Classic theme — elegant French-American restaurant" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative z-10 p-6 w-full">
                  <div className="text-xs tracking-widest uppercase text-white/70 mb-1">{DEMO_CUISINES.classic}</div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                    {DEMO_NAMES.classic}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: themes.classic.colors.accent }}>
                      Classic Theme
                    </span>
                    <span className="text-xs text-white/70">Menu · Reservations · Gallery · Events</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 4 smaller cards */}
          {(["modern", "rustic", "playful", "bright"] as ThemeId[]).map((id) => (
            <Link key={id} href={`/r/${DEMO_SLUGS[id]}`} className="group block">
              <div className="rounded-2xl overflow-hidden border border-neutral-200 group-hover:border-neutral-400 transition-all group-hover:shadow-lg">
                <div className="h-44 relative flex items-end">
                  <img src={DEMO_IMAGES[id]} alt={`${themes[id].label} theme — ${DEMO_CUISINES[id]}`} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="relative z-10 p-4 w-full flex items-end justify-between">
                    <div>
                      <div className="text-lg font-bold text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                        {DEMO_NAMES[id]}
                      </div>
                      <div className="text-xs text-white/70">{DEMO_CUISINES[id]}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ background: themes[id].colors.accent }}>
                      {themes[id].label}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link href="/themes" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            Explore all 5 themes in detail &rarr;
          </Link>
        </div>
      </section>

      {/* What's included — grouped, not a flat grid */}
      <section id="features" className="border-t border-neutral-100 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="font-[family-name:var(--font-display)] text-4xl text-neutral-900 mb-4 text-center">
            Everything a restaurant needs
          </h2>
          <p className="text-lg text-neutral-500 text-center mb-16 max-w-xl mx-auto">
            One platform replaces your website, reservation system, email marketing, and guest database.
          </p>

          {/* Group 1: Your Restaurant Online */}
          <div className="mb-16">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">Your Restaurant Online</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FeatureCard
                title="Branded Website"
                desc="5 themes designed for restaurants. Menu, about, gallery, contact — your domain, your brand. Not a listing on someone else's platform."
              />
              <FeatureCard
                title="Custom Domains"
                desc="Your restaurant at yourdomain.com. SSL included. Setup takes 2 minutes. No coding required."
              />
              <FeatureCard
                title="Menu Editor"
                desc="Add, edit, 86 items. Dietary flags, categories, prices. Changes go live instantly. No third-party menu service."
              />
              <FeatureCard
                title="Accessibility Built In"
                desc="Every site meets WCAG 2.2 AA — the legal standard for ADA, EAA, and AODA compliance. Alt text enforced at the database level. Keyboard navigation, screen reader support, contrast-safe text over images. Your restaurant is protected."
                highlight
              />
            </div>
          </div>

          {/* Group 2: Run Your Floor */}
          <div className="mb-16">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">Run Your Floor</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                title="Reservations"
                desc="Built-in booking with real table availability. Party size, turn times, automatic table assignment. Zero per-reservation fees."
                highlight
              />
              <FeatureCard
                title="Floor Management"
                desc="Visual floor plan with live table status. Open, occupied, turning. iPad-ready for the host stand. One-tap seat, complete, no-show."
              />
              <FeatureCard
                title="Events"
                desc="Wine dinners, tasting menus, pop-ups. Event pages with booking, capacity management, and date polling built in."
              />
            </div>
          </div>

          {/* Group 3: Own Your Data */}
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">Own Your Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                title="Guest CRM"
                desc="Every booking builds a guest profile. Visit history, preferences, dietary notes, tags. Your data — exportable anytime."
              />
              <FeatureCard
                title="Data Ownership"
                desc="Your guest list, booking history, and reviews belong to you. We never sell your data or market to your guests."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social proof / differentiator */}
      <section className="border-t border-neutral-100">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-neutral-900 mb-6">
            Stop paying per reservation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div>
              <div className="font-[family-name:var(--font-display)] text-5xl text-neutral-900 mb-2">$0</div>
              <div className="text-base text-neutral-500">per reservation, forever</div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-5xl text-neutral-900 mb-2">5</div>
              <div className="text-base text-neutral-500">professionally designed themes</div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-5xl text-neutral-900 mb-2">100%</div>
              <div className="text-base text-neutral-500">your data, always exportable</div>
            </div>
          </div>
        </div>
      </section>

      {/* Themes section */}
      <section id="themes" className="border-t border-neutral-100 bg-neutral-50 py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-4xl text-neutral-900 mb-4">
            5 themes, one platform
          </h2>
          <p className="text-lg text-neutral-500 mb-10 max-w-xl mx-auto">
            Each designed for a different kind of restaurant. Same features, completely different personality.
          </p>
          {/* Theme color swatches */}
          <div className="flex justify-center gap-6 mb-10">
            {themeIds.map((id) => (
              <Link key={id} href={`/r/${DEMO_SLUGS[id]}`} className="group text-center">
                <div className="flex gap-1 mb-2 justify-center">
                  {[themes[id].colors.navBg, themes[id].colors.accent, themes[id].colors.bg, themes[id].colors.surface].map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-neutral-200 group-hover:scale-110 transition-transform" style={{ background: c }} />
                  ))}
                </div>
                <div className="text-xs font-medium text-neutral-500 group-hover:text-neutral-900 transition-colors">{themes[id].label}</div>
              </Link>
            ))}
          </div>
          <Link href="/themes" className="rounded-full bg-neutral-900 text-white px-8 py-4 text-lg font-bold hover:bg-neutral-700 transition-colors">
            Explore All Themes
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-[family-name:var(--font-display)] text-4xl text-neutral-900 mb-4">
            Simple pricing
          </h2>
          <p className="text-lg text-neutral-500 mb-12">
            One plan. Everything included. No per-reservation fees. No surprise charges.
          </p>
          <div className="border-2 border-neutral-900 rounded-2xl p-10">
            <div className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">Everything</div>
            <div className="flex items-baseline justify-center gap-1 mb-4">
              <span className="font-[family-name:var(--font-display)] text-6xl text-neutral-900">$99</span>
              <span className="text-neutral-500 text-lg">/mo</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-neutral-500 mb-8">
              <span>Website</span><span className="text-neutral-300">+</span>
              <span>Reservations</span><span className="text-neutral-300">+</span>
              <span>CRM</span><span className="text-neutral-300">+</span>
              <span>Events</span><span className="text-neutral-300">+</span>
              <span>Custom Domain</span>
            </div>
            <Link href="/themes" className="inline-block rounded-full bg-neutral-900 text-white px-10 py-4 text-lg font-bold hover:bg-neutral-700 transition-colors">
              Browse Themes
            </Link>
            <p className="text-sm text-neutral-400 mt-6">
              No per-cover fees. No setup fees. No contracts. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-[family-name:var(--font-display)] text-xl text-neutral-900">Remi</span>
          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <a href="#features" className="hover:text-neutral-900 transition-colors">Features</a>
            <Link href="/themes" className="hover:text-neutral-900 transition-colors">Themes</Link>
            <a href="#pricing" className="hover:text-neutral-900 transition-colors">Pricing</a>
            <Link href="/r/volta" className="hover:text-neutral-900 transition-colors">Demo</Link>
            <Link href="/accessibility" className="hover:text-neutral-900 transition-colors">Accessibility</Link>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-neutral-200 px-4 py-3 z-40">
        <Link href="/r/volta" className="block w-full rounded-full bg-neutral-900 text-white py-3 text-center text-sm font-bold hover:bg-neutral-700 transition-colors">
          See a Live Demo
        </Link>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, highlight }: { title: string; desc: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-6 ${highlight ? "bg-white border-2 border-neutral-900 shadow-sm" : "bg-white border border-neutral-200"}`}>
      <h4 className="text-base font-bold text-neutral-900 mb-2">{title}</h4>
      <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
    </div>
  );
}
