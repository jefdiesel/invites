import { themes, type ThemeId } from "@/lib/themes";
import Link from "next/link";

export const metadata = {
  title: "Themes — Restaurant Site Templates",
  description: "5 professionally designed themes for restaurant websites. Modern, Classic, Rustic, Playful, Bright.",
};

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
  modern: "JAPANESE · $$$$",
  classic: "FRENCH-AMERICAN · $$$",
  rustic: "FARM-TO-TABLE · $$",
  playful: "BURGERS & SHAKES · $",
  bright: "NEW AMERICAN · $$$",
};

const PHILOSOPHY: Record<ThemeId, { vibe: string; bestFor: string; fontNote: string; colorNote: string; details: string }> = {
  modern: {
    vibe: "Less is more. Sharp edges, monochrome palette, every element earns its place.",
    bestFor: "Omakase counters, wine bars, tasting rooms, minimalist cafes",
    fontNote: "Inter for both headings and body. Clean, geometric, no decoration.",
    colorNote: "Black and white with zero accent color. The food is the color.",
    details: "Square corners, clean price alignment without leaders, light nav bar. The design disappears so the content speaks.",
  },
  classic: {
    vibe: "Warm, elegant, timeless. The candlelit dinner of web design.",
    bestFor: "Fine dining, French bistros, Italian trattorias, steakhouses",
    fontNote: "DM Serif Display for headings gives editorial weight. System sans for body keeps it readable.",
    colorNote: "Warm stone tones with burnt orange accent. Feels like linen tablecloths and wood paneling.",
    details: "Dotted leader lines on menu prices (like a printed menu). Subtle cross-hatch texture on dark sections. Small border radius.",
  },
  rustic: {
    vibe: "Honest, grounded, handmade. Mud on your boots, herbs in your hand.",
    bestFor: "Farm-to-table, country kitchens, brewpubs, farmhouse restaurants",
    fontNote: "Libre Baskerville for headings. Traditional serif with a literary feel, like a cookbook.",
    colorNote: "Sage green accent on parchment backgrounds. Earthy, never flashy.",
    details: "Solid line leaders on menu prices. Textured dark sections. The palette says 'we grew this ourselves.'",
  },
  playful: {
    vibe: "Fun, friendly, come as you are. Design that makes you smile.",
    bestFor: "Burger joints, taco shops, ice cream parlors, family restaurants, cafes",
    fontNote: "Fredoka for headings. Rounded, bubbly, approachable. It doesn't take itself too seriously.",
    colorNote: "Warm cream base with coral red accent. The nav IS the accent color. Bold and unapologetic.",
    details: "Full border radius on everything (pills, buttons, badges). Clean menu without price leaders. The shape language is round and soft.",
  },
  bright: {
    vibe: "Bold, contemporary, high-energy. For restaurants that think of themselves as brands.",
    bestFor: "New American, cocktail bars, modern bistros, fast-casual concepts",
    fontNote: "Space Grotesk for everything. Geometric, technical, with just enough personality.",
    colorNote: "Cool gray base with electric blue accent. High contrast, zero warmth. It hits different.",
    details: "Large border radius on cards, medium on buttons. Clean menu. The color is the statement.",
  },
};

export default function ThemesPage() {
  const themeList = Object.values(themes);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-6 inline-block">&larr; Back</Link>
          <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-6xl text-neutral-900 mb-6">
            Themes
          </h1>
          <p className="text-xl text-neutral-500 max-w-2xl leading-relaxed">
            Five restaurant website templates, each designed for a different kind of place.
            Same features, completely different personality. Pick the one that feels like your restaurant.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Philosophy */}
        <section className="mb-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-neutral-900 mb-6">Design philosophy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-base text-neutral-600 leading-relaxed">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Accessibility first</h3>
              <p>Every theme passes WCAG 2.2 AA. Text contrast ratios are enforced. All images require alt text at the database level. Keyboard navigation works everywhere. Skip-to-content links, ARIA landmarks, focus indicators.</p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">One codebase</h3>
              <p>All five themes render from the same page component. The theme token system controls colors, fonts, border radius, textures, and menu styles. No duplicate code. Change the theme column in the database and the whole site transforms.</p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Real restaurant needs</h3>
              <p>Every theme includes: menu with dietary flags, reservation booking, hours with today highlight, about page with editorial + photos, photo gallery, contact with directions, and an accessibility statement.</p>
            </div>
          </div>
        </section>

        {/* Theme cards */}
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-neutral-900 mb-10">The themes</h2>
          <div className="space-y-20">
            {themeList.map((theme) => {
              const slug = DEMO_SLUGS[theme.id];
              const name = DEMO_NAMES[theme.id];
              const phil = PHILOSOPHY[theme.id];
              const t = theme.colors;

              return (
                <article key={theme.id} className="group">
                  {/* Preview bar */}
                  <div className="rounded-xl overflow-hidden shadow-lg mb-8">
                    {/* Fake nav preview */}
                    <div className="h-12 flex items-center px-5 gap-4 text-sm" style={{ background: t.navBg }}>
                      <span className="font-bold" style={{ color: theme.navStyle === "light" ? t.text : "#fff" }}>{name}</span>
                      <span style={{ color: t.navText }} className="hidden sm:inline">Menu</span>
                      <span style={{ color: t.navText }} className="hidden sm:inline">About</span>
                      <span style={{ color: t.navText }} className="hidden sm:inline">Gallery</span>
                      <div className="ml-auto">
                        <span className="px-3 py-1 text-xs font-bold text-white"
                              style={{ background: t.accent, borderRadius: theme.radius === "full" ? "9999px" : theme.radius === "none" ? "0" : "0.375rem" }}>
                          Reserve
                        </span>
                      </div>
                    </div>
                    {/* Hero preview with cover image */}
                    <div className="h-48 md:h-56 relative flex items-end">
                      <img
                        src={DEMO_IMAGES[theme.id]}
                        alt={`${name} restaurant interior`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                      <div className="relative z-10 px-5 pb-5" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)" }}>
                        <div className="text-[10px] tracking-widest uppercase mb-1 text-white/80">{DEMO_CUISINES[theme.id]}</div>
                        <div className="text-3xl md:text-4xl font-bold text-white">{name}</div>
                      </div>
                    </div>
                    {/* Fake content preview */}
                    <div className="h-20 flex items-center px-5 gap-8" style={{ background: t.surfaceAlt }}>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: t.accent }}>Starters</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold" style={{ color: t.text }}>Dish Name</span>
                          {theme.menuStyle === "dots" && <span className="w-12 border-b border-dotted" style={{ borderColor: t.border }} />}
                          {theme.menuStyle === "line" && <span className="w-12 border-b" style={{ borderColor: t.border }} />}
                          <span className="text-sm" style={{ color: t.textMuted }}>$18</span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>Description text here</div>
                      </div>
                    </div>
                    {/* Fake footer preview */}
                    <div className="h-8 flex items-center px-5" style={{ background: t.footerBg }}>
                      <span className="text-[10px]" style={{ color: t.footerTextMuted }}>{name} · About · Gallery · Contact · Accessibility</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                      <h3 className="text-2xl font-bold text-neutral-900 mb-1">
                        {theme.label}
                        <span className="text-sm font-normal text-neutral-400 ml-3">{theme.description}</span>
                      </h3>
                      <p className="text-base text-neutral-600 leading-relaxed mt-3 mb-4">
                        {phil.vibe}
                      </p>
                      <div className="space-y-2 text-sm text-neutral-500">
                        <p><span className="font-semibold text-neutral-700">Typography:</span> {phil.fontNote}</p>
                        <p><span className="font-semibold text-neutral-700">Color:</span> {phil.colorNote}</p>
                        <p><span className="font-semibold text-neutral-700">Details:</span> {phil.details}</p>
                        <p><span className="font-semibold text-neutral-700">Best for:</span> {phil.bestFor}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 justify-center">
                      <Link
                        href={`/r/${slug}`}
                        className="block text-center px-6 py-3 text-base font-bold text-white rounded-lg transition-colors"
                        style={{ background: t.accent }}
                      >
                        View Demo &rarr;
                      </Link>
                      <div className="flex gap-2 text-sm">
                        <Link href={`/r/${slug}/about`} className="flex-1 text-center py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">About</Link>
                        <Link href={`/r/${slug}/gallery`} className="flex-1 text-center py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Gallery</Link>
                        <Link href={`/r/${slug}/contact`} className="flex-1 text-center py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Contact</Link>
                        <Link href={`/r/${slug}/book`} className="flex-1 text-center py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">Book</Link>
                      </div>
                      {/* Color swatches */}
                      <div className="flex gap-1 mt-2">
                        {[t.bg, t.surface, t.surfaceAlt, t.text, t.textMuted, t.accent, t.navBg, t.heroBg].map((color, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border border-neutral-200" style={{ background: color }} title={color} />
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 py-10 text-center text-sm text-neutral-400">
        Restaurant Website Templates — WCAG 2.2 AA Compliant
      </footer>
    </div>
  );
}
