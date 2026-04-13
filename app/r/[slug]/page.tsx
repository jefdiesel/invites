import { getBusiness, getBusinessHours, getMenuItems } from "@/lib/restaurant-queries";
import { getTheme } from "@/lib/themes";
import { ThemeFonts } from "@/app/components/theme-fonts";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DIETARY: Record<string, { label: string; bg: string; fg: string }> = {
  V:  { label: "Vegetarian",  bg: "#e8f0ea", fg: "#5a7a62" },
  VG: { label: "Vegan",       bg: "#e8f0ea", fg: "#5a7a62" },
  GF: { label: "Gluten-Free", bg: "#fef3c7", fg: "#92400e" },
  DF: { label: "Dairy-Free",  bg: "#dbeafe", fg: "#1e40af" },
};

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const theme = getTheme(biz.theme);
  const hours = await getBusinessHours(biz.id);
  const menu = await getMenuItems(biz.id);

  const categories = [...new Set(menu.map((m) => m.category))];
  const menuByCategory = categories.map((cat) => ({
    category: cat,
    items: menu.filter((m) => m.category === cat),
  }));

  const today = new Date().getDay();
  const todayHours = hours.find((h) => h.day_of_week === today);
  const isOpenToday = todayHours && !todayHours.is_closed;

  const allFlags = new Set<string>();
  menu.forEach((m) => m.dietary_flags?.forEach((f: string) => allFlags.add(f)));

  const t = theme.colors;
  const displayFont = theme.fonts.display === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.display}', serif`;
  const bodyFont = theme.fonts.body === "system" ? "var(--font-geist-sans)" : `'${theme.fonts.body}', sans-serif`;

  const r = theme.radius === "none" ? "0" : theme.radius === "sm" ? "0.375rem" : theme.radius === "lg" ? "0.75rem" : "9999px";
  const rBtn = theme.radius === "full" ? "9999px" : r;
  const rCard = theme.radius === "full" ? "1rem" : r;

  const textureOverlay = theme.texture ? (
    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
    }} />
  ) : null;

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: bodyFont }} className="min-h-screen scroll-pt-14">
      <ThemeFonts theme={theme} />

      {/* Skip to content */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:text-sm focus:font-bold"
        style={{ background: t.accent, color: "#fff", borderRadius: rBtn }}
      >
        Skip to content
      </a>

      {/* Nav */}
      <nav
        aria-label={`${biz.name} navigation`}
        className="sticky top-0 z-40 backdrop-blur"
        style={{
          background: t.navBg,
          borderBottom: theme.navStyle === "light" ? `1px solid ${t.border}` : "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
          <a href={`/r/${slug}`} className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
             style={{ outlineColor: theme.navStyle === "light" ? t.accent : "#fff" }}>
            {biz.logo_url && <img src={biz.logo_url} alt="" className="h-8 w-auto" />}
            <span style={{ fontFamily: displayFont, color: theme.navStyle === "light" ? t.text : "#fff" }}
                  className="text-xl">
              {biz.name}
            </span>
          </a>
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            {menuByCategory.length > 0 && (
              <a href="#menu" className="font-medium transition-colors" style={{ color: t.navText }}>Menu</a>
            )}
            <Link href={`/r/${slug}/about`} className="font-medium transition-colors" style={{ color: t.navText }}>About</Link>
            <Link href={`/r/${slug}/gallery`} className="font-medium transition-colors" style={{ color: t.navText }}>Gallery</Link>
            <Link href={`/r/${slug}/contact`} className="font-medium transition-colors" style={{ color: t.navText }}>Contact</Link>
            <Link href={`/r/${slug}/book`}
              className="px-5 py-1.5 text-sm font-bold text-white transition-colors"
              style={{ background: t.accent, borderRadius: rBtn }}>
              Reserve
            </Link>
          </div>
          {/* Mobile */}
          <div className="flex md:hidden">
            <Link href={`/r/${slug}/book`}
              className="px-4 py-1.5 text-sm font-bold text-white transition-colors"
              style={{ background: t.accent, borderRadius: rBtn }}>
              Reserve
            </Link>
          </div>
        </div>
        {/* Mobile section links */}
        <div className="flex md:hidden overflow-x-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-1 px-6 py-2 text-xs">
            {menuByCategory.length > 0 && (
              <a href="#menu" className="px-3 py-1 transition-colors" style={{ color: t.navText, borderRadius: rBtn }}>Menu</a>
            )}
            <Link href={`/r/${slug}/about`} className="px-3 py-1 transition-colors" style={{ color: t.navText, borderRadius: rBtn }}>About</Link>
            <Link href={`/r/${slug}/gallery`} className="px-3 py-1 transition-colors" style={{ color: t.navText, borderRadius: rBtn }}>Gallery</Link>
            <Link href={`/r/${slug}/contact`} className="px-3 py-1 transition-colors" style={{ color: t.navText, borderRadius: rBtn }}>Contact</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">
        {biz.cover_image_url ? (
          <div className="h-[480px] md:h-[520px] relative">
            <img src={biz.cover_image_url} alt={`${biz.name} interior`} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
            <div className="relative z-10 h-full flex flex-col justify-end max-w-4xl mx-auto px-6 pb-14">
              <HeroText biz={biz} slug={slug} isOpenToday={isOpenToday} todayHours={todayHours}
                        displayFont={displayFont} accent={t.accent} rBtn={rBtn} overlay />
            </div>
          </div>
        ) : (
          <div className="relative" style={{ background: t.heroBg }}>
            {textureOverlay}
            <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-32">
              <HeroText biz={biz} slug={slug} isOpenToday={isOpenToday} todayHours={todayHours}
                        displayFont={displayFont} accent={t.accent} rBtn={rBtn} overlay={false}
                        heroText={t.heroText} heroTextMuted={t.heroTextMuted} />
            </div>
          </div>
        )}
      </header>

      <main id="main">
        {/* About */}
        {biz.about && biz.about.length > 60 && (
          <section style={{ background: t.surface }}>
            <div className="max-w-4xl mx-auto px-6 py-14 md:py-20">
              <p className="text-lg md:text-xl leading-relaxed max-w-2xl font-light" style={{ color: t.textMuted }}>
                {biz.about}
              </p>
            </div>
          </section>
        )}

        {/* Menu */}
        {menuByCategory.length > 0 && (
          <section id="menu" style={{ background: t.surfaceAlt }}>
            <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
              <h2 style={{ fontFamily: displayFont, color: t.text }} className="text-3xl md:text-4xl mb-12">
                Menu
              </h2>
              <div className={`grid grid-cols-1 ${theme.menuColumns === 2 ? "md:grid-cols-2" : ""} gap-x-16 gap-y-14`}>
                {menuByCategory.map((cat) => (
                  <div key={cat.category}>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-6 pb-2"
                        style={{
                          color: t.accent,
                          borderBottom: theme.sectionDivider === "accent-line"
                            ? `2px solid ${t.accent}`
                            : `1px solid ${t.border}`,
                        }}>
                      {cat.category}
                    </h3>
                    <div className="space-y-5">
                      {cat.items.map((item) => (
                        <div key={item.id}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-base font-semibold" style={{ color: t.text }}>{item.name}</span>
                            {theme.menuStyle === "dots" && (
                              <span className="flex-1 min-w-[20px] translate-y-[-4px]" style={{ borderBottom: `1px dotted ${t.border}` }} />
                            )}
                            {theme.menuStyle === "line" && (
                              <span className="flex-1 min-w-[20px] translate-y-[-4px]" style={{ borderBottom: `1px solid ${t.border}` }} />
                            )}
                            <span className="text-base font-medium tabular-nums shrink-0" style={{ color: t.textMuted }}>
                              {item.price_cents > 0 ? `$${(item.price_cents / 100).toFixed(0)}` : ""}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm mt-1 leading-relaxed" style={{ color: t.textMuted }}>{item.description}</p>
                          )}
                          {item.dietary_flags && item.dietary_flags.length > 0 && (
                            <div className="flex gap-1.5 mt-2">
                              {item.dietary_flags.map((flag: string) => {
                                const info = DIETARY[flag];
                                return (
                                  <span key={flag}
                                    className="px-2 py-0.5 text-[11px] font-semibold"
                                    style={{ background: info?.bg ?? t.accentMuted, color: info?.fg ?? t.textMuted, borderRadius: rBtn }}
                                    title={info?.label ?? flag} role="img" aria-label={info?.label ?? flag}>
                                    {flag}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {allFlags.size > 0 && (
                <div className="mt-14 pt-6 flex flex-wrap gap-4 text-xs" style={{ borderTop: `1px solid ${t.border}`, color: t.textLight }}>
                  {[...allFlags].map((flag) => {
                    const info = DIETARY[flag];
                    return (
                      <span key={flag} className="flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: info?.fg ?? t.textLight }} />
                        {info?.label ?? flag}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Hours + Contact */}
        <section style={{ background: t.surface }}>
          <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {hours.length > 0 && (
              <div id="hours">
                <h2 style={{ fontFamily: displayFont, color: t.text }} className="text-3xl mb-8">Hours</h2>
                <div className="space-y-2.5">
                  {hours.map((h) => {
                    const isToday = h.day_of_week === today;
                    return (
                      <div key={h.day_of_week} className="flex items-center justify-between py-1.5"
                           style={{ color: isToday ? t.text : t.textMuted }}>
                        <span className={`text-sm ${isToday ? "font-semibold" : ""}`}>
                          {DAYS[h.day_of_week]}
                          {isToday && (
                            <span className="ml-2 text-[11px] font-bold text-white px-2 py-0.5 align-middle"
                                  style={{ background: t.accent, borderRadius: rBtn }}>
                              Today
                            </span>
                          )}
                        </span>
                        {h.is_closed ? (
                          <span className="text-sm italic" style={{ color: t.textLight }}>Closed</span>
                        ) : (
                          <span className="text-sm tabular-nums font-medium">{formatTime(h.open_time)} – {formatTime(h.close_time)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div id="contact">
              <h2 style={{ fontFamily: displayFont, color: t.text }} className="text-3xl mb-8">Find Us</h2>
              <div className="space-y-4">
                {biz.address && (
                  <div>
                    <p className="text-base font-medium" style={{ color: t.text }}>{biz.address}</p>
                    <p className="text-sm" style={{ color: t.textMuted }}>
                      {[biz.city, biz.state, biz.zip].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="block text-base transition-colors" style={{ color: t.textMuted }}>{biz.phone}</a>
                )}
                {biz.email && (
                  <a href={`mailto:${biz.email}`} className="block text-base transition-colors" style={{ color: t.textMuted }}>{biz.email}</a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden" style={{ background: t.heroBg }}>
          {textureOverlay}
          <div className="relative max-w-4xl mx-auto px-6 py-20 md:py-28 text-center">
            <h2 style={{ fontFamily: displayFont, color: t.heroText }} className="text-3xl md:text-4xl mb-4">
              {isOpenToday ? "Join us tonight" : "Make a reservation"}
            </h2>
            <p className="text-base mb-10" style={{ color: t.heroTextMuted }}>
              {isOpenToday && todayHours
                ? `Open today until ${formatTime(todayHours.close_time)}`
                : `${hours.filter(h => !h.is_closed).map(h => SHORT_DAYS[h.day_of_week]).join(", ")}`}
            </p>
            <Link href={`/r/${slug}/book`}
              className="inline-block px-10 py-4 text-lg font-bold text-white transition-colors"
              style={{ background: t.accent, borderRadius: rBtn }}>
              Reserve a Table
            </Link>
          </div>
        </section>
      </main>

      <footer style={{ background: t.footerBg, borderTop: "1px solid rgba(255,255,255,0.1)" }} className="py-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <span style={{ fontFamily: displayFont, color: t.footerText }} className="text-lg">{biz.name}</span>
              {biz.address && (
                <span className="text-sm ml-3" style={{ color: t.footerTextMuted }}>
                  {biz.address}{biz.city ? `, ${biz.city}` : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm" style={{ color: t.footerTextMuted }}>
              {biz.phone && <a href={`tel:${biz.phone}`} className="transition-colors hover:opacity-80">{biz.phone}</a>}
              {biz.email && <a href={`mailto:${biz.email}`} className="transition-colors hover:opacity-80">{biz.email}</a>}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs" style={{ color: t.footerTextMuted }}>
            <Link href={`/r/${slug}/about`} className="transition-colors hover:opacity-80">About</Link>
            <Link href={`/r/${slug}/gallery`} className="transition-colors hover:opacity-80">Gallery</Link>
            <Link href={`/r/${slug}/contact`} className="transition-colors hover:opacity-80">Contact</Link>
            <Link href={`/r/${slug}/accessibility`} className="transition-colors hover:opacity-80">Accessibility</Link>
          </div>
        </div>
      </footer>

      {/* Hover styles for nav links (can't do inline) */}
      <style>{`
        nav a:hover { color: ${t.navTextHover} !important; }
        #contact a:hover { color: ${t.accent} !important; }
      `}</style>
    </div>
  );
}

function HeroText({
  biz, slug, isOpenToday, todayHours, displayFont, accent, rBtn, overlay,
  heroText, heroTextMuted,
}: {
  biz: { name: string; cuisine: string; price_range: string; about: string };
  slug: string;
  isOpenToday: boolean | null | undefined;
  todayHours: { open_time: string; close_time: string } | null | undefined;
  displayFont: string; accent: string; rBtn: string; overlay: boolean;
  heroText?: string; heroTextMuted?: string;
}) {
  const textColor = overlay ? "#ffffff" : (heroText ?? "#ffffff");
  const mutedColor = overlay ? "rgba(255,255,255,0.85)" : (heroTextMuted ?? "rgba(255,255,255,0.6)");
  // Text shadow guarantees readability over any image (WCAG SC 1.4.3)
  const shadow = overlay ? "0 2px 12px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)" : "none";

  return (
    <div style={{ textShadow: shadow }}>
      {(biz.cuisine || biz.price_range) && (
        <div className="text-sm font-medium tracking-[0.2em] uppercase mb-4" style={{ color: mutedColor }}>
          {[biz.cuisine, biz.price_range].filter(Boolean).join(" · ")}
        </div>
      )}
      <h1 style={{ fontFamily: displayFont, color: textColor }} className="text-5xl md:text-7xl tracking-tight">
        {biz.name}
      </h1>
      {biz.about && biz.about.length <= 80 && (
        <p className="mt-4 text-lg md:text-xl font-light max-w-xl" style={{ color: mutedColor }}>
          {biz.about}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link href={`/r/${slug}/book`}
          className="px-8 py-3.5 text-base font-bold text-white transition-colors"
          style={{ background: accent, borderRadius: rBtn, textShadow: "none" }}>
          Reserve a Table
        </Link>
        {isOpenToday && todayHours && (
          <span className="text-sm font-medium" style={{ color: mutedColor }}>
            Open tonight until {formatTime(todayHours.close_time)}
          </span>
        )}
      </div>
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
