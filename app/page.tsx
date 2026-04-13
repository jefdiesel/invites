import Link from "next/link";
import { themes } from "@/lib/themes";

const DEMO_SLUGS = {
  modern: "nori",
  classic: "chez-laurent",
  rustic: "copper-hen",
  playful: "bennys",
  bright: "volta",
};

const DEMO_IMAGES = {
  modern: "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&q=80",
  classic: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  rustic: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80",
  playful: "https://images.unsplash.com/photo-1466220549276-aef9ce186540?w=800&q=80",
  bright: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-[family-name:var(--font-display)] text-2xl text-neutral-900">Remi</span>
          <div className="flex items-center gap-6 text-sm">
            <a href="#features" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Features</a>
            <a href="#themes" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Themes</a>
            <a href="#pricing" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Pricing</a>
            <Link href="/polls" className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium">Events</Link>
            <Link href="/themes" className="rounded-full bg-neutral-900 text-white px-5 py-2 font-bold hover:bg-neutral-700 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-6xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="max-w-3xl">
          <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl text-neutral-900 leading-[1.1] mb-6">
            Your restaurant deserves its own website
          </h1>
          <p className="text-xl md:text-2xl text-neutral-500 leading-relaxed mb-10 max-w-2xl">
            A beautiful site with built-in reservations, menu, events, and guest CRM. One platform, one flat monthly fee. No per-reservation charges. Ever.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/themes" className="rounded-full bg-neutral-900 text-white px-8 py-4 text-lg font-bold hover:bg-neutral-700 transition-colors">
              See the Themes
            </Link>
            <Link href="/r/volta" className="rounded-full border-2 border-neutral-200 text-neutral-700 px-8 py-4 text-lg font-bold hover:border-neutral-400 transition-colors">
              Live Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Theme previews strip */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(Object.keys(themes) as (keyof typeof themes)[]).map((id) => {
              const t = themes[id];
              const slug = DEMO_SLUGS[id];
              const img = DEMO_IMAGES[id];
              return (
                <Link key={id} href={`/r/${slug}`} className="group block">
                  <div className="rounded-xl overflow-hidden border border-neutral-200 group-hover:border-neutral-400 transition-colors">
                    <div className="h-32 relative">
                      <img src={img} alt={`${t.label} theme demo`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-3 text-white text-sm font-bold" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                        {t.label}
                      </div>
                    </div>
                    <div className="h-2" style={{ background: t.colors.accent }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="font-[family-name:var(--font-display)] text-4xl text-neutral-900 mb-16 text-center">
          Everything a restaurant needs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: "Branded Website", desc: "5 themes designed for restaurants. Menu, about, gallery, contact pages. Your domain, your brand." },
            { title: "Reservations", desc: "Built-in booking with real availability. Table assignment, turn times, party size. Zero per-reservation fees. Flat monthly rate." },
            { title: "Floor Management", desc: "Visual floor plan with live table status. Open, occupied, turning. iPad-ready for the host stand. Seat, complete, no-show in one tap." },
            { title: "Menu Editor", desc: "Add, edit, 86 items. Dietary flags with accessibility-compliant labels. Categories. Prices. No third-party menu service needed." },
            { title: "Guest CRM", desc: "Every guest who books builds a profile. Visit history, preferences, dietary notes, tags. Your data — you own it, you can export it anytime." },
            { title: "Events", desc: "Wine dinners, tasting menus, pop-ups. Event pages with booking and capacity management. Built in, not bolted on." },
            { title: "Custom Domains", desc: "Your restaurant on your domain. SSL included. Setup takes 2 minutes." },
            { title: "Accessibility", desc: "WCAG 2.2 AA compliant. Alt text enforced at database level. Keyboard navigation. Screen reader support. Contrast ratios checked." },
            { title: "Data Ownership", desc: "Your guest list, your booking history, your reviews. All exportable. We never sell your data or market to your guests." },
          ].map((f) => (
            <div key={f.title}>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">{f.title}</h3>
              <p className="text-base text-neutral-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
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
          <Link href="/themes" className="rounded-full bg-neutral-900 text-white px-8 py-4 text-lg font-bold hover:bg-neutral-700 transition-colors">
            Explore Themes
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
              <span className="text-neutral-500">/mo</span>
            </div>
            <p className="text-neutral-500 mb-8">Website + reservations + CRM + events + custom domain</p>
            <Link href="/themes" className="inline-block rounded-full bg-neutral-900 text-white px-10 py-4 text-lg font-bold hover:bg-neutral-700 transition-colors">
              Get Started
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
            <Link href="/themes" className="hover:text-neutral-900 transition-colors">Themes</Link>
            <Link href="/polls" className="hover:text-neutral-900 transition-colors">Events</Link>
            <Link href="/r/volta" className="hover:text-neutral-900 transition-colors">Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
