import { getBusiness, getBusinessHours, getMenuItems } from "@/lib/restaurant-queries";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Dietary flag display
const DIETARY: Record<string, { label: string; color: string }> = {
  V: { label: "Vegetarian", color: "bg-sage-light text-sage" },
  VG: { label: "Vegan", color: "bg-sage-light text-sage" },
  GF: { label: "Gluten-Free", color: "bg-amber-50 text-amber-700" },
  DF: { label: "Dairy-Free", color: "bg-blue-50 text-blue-700" },
};

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

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

  // Collect all dietary flags used in menu for legend
  const allFlags = new Set<string>();
  menu.forEach((m) => m.dietary_flags?.forEach((f: string) => allFlags.add(f)));

  return (
    <div className="min-h-screen bg-cream scroll-pt-14">
      {/* Skip to content */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-warm-900 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>

      {/* Nav */}
      <nav aria-label={`${biz.name} navigation`} className="sticky top-0 z-40 bg-warm-900/95 backdrop-blur border-b border-warm-800">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
          <a href={`/r/${slug}`} className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded">
            {biz.logo_url && <img src={biz.logo_url} alt="" className="h-8 w-auto" />}
            <span className="font-[family-name:var(--font-display)] text-xl text-white">{biz.name}</span>
          </a>
          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            {menuByCategory.length > 0 && (
              <a href="#menu" className="text-warm-300 hover:text-white transition-colors font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded">Menu</a>
            )}
            <a href="#hours" className="text-warm-300 hover:text-white transition-colors font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded">Hours</a>
            <a href="#contact" className="text-warm-300 hover:text-white transition-colors font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded">Find Us</a>
            <Link
              href={`/r/${slug}/book`}
              className="rounded-full bg-accent px-5 py-1.5 text-sm font-bold text-white hover:bg-accent-light transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Reserve
            </Link>
          </div>
          {/* Mobile: just the reserve button */}
          <div className="flex md:hidden">
            <Link
              href={`/r/${slug}/book`}
              className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-white hover:bg-accent-light transition-colors"
            >
              Reserve
            </Link>
          </div>
        </div>
        {/* Mobile section links */}
        <div className="flex md:hidden border-t border-warm-800 overflow-x-auto">
          <div className="flex items-center gap-1 px-6 py-2 text-xs">
            {menuByCategory.length > 0 && (
              <a href="#menu" className="text-warm-400 hover:text-white px-3 py-1 rounded-full transition-colors">Menu</a>
            )}
            <a href="#hours" className="text-warm-400 hover:text-white px-3 py-1 rounded-full transition-colors">Hours</a>
            <a href="#contact" className="text-warm-400 hover:text-white px-3 py-1 rounded-full transition-colors">Find Us</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">
        {biz.cover_image_url ? (
          <div className="h-[480px] md:h-[520px] relative">
            <img
              src={biz.cover_image_url}
              alt={`${biz.name} interior`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-end max-w-4xl mx-auto px-6 pb-14">
              <HeroText biz={biz} slug={slug} isOpenToday={isOpenToday} todayHours={todayHours} overlay />
            </div>
          </div>
        ) : (
          /* No image: atmospheric dark hero with subtle texture */
          <div className="bg-warm-900 relative">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }} />
            <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-32">
              <HeroText biz={biz} slug={slug} isOpenToday={isOpenToday} todayHours={todayHours} overlay={false} />
            </div>
          </div>
        )}
      </header>

      <main id="main">
        {/* About */}
        {biz.about && biz.about.length > 60 && (
          <section className="bg-white">
            <div className="max-w-4xl mx-auto px-6 py-14 md:py-20">
              <p className="text-lg md:text-xl text-warm-600 leading-relaxed max-w-2xl font-light">
                {biz.about}
              </p>
            </div>
          </section>
        )}

        {/* Menu */}
        {menuByCategory.length > 0 && (
          <section id="menu" className="bg-cream">
            <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-warm-900 mb-12">
                Menu
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-14">
                {menuByCategory.map((cat) => (
                  <div key={cat.category}>
                    <h3 className="text-sm font-bold text-accent uppercase tracking-widest mb-6 pb-2 border-b border-warm-200">
                      {cat.category}
                    </h3>
                    <div className="space-y-5">
                      {cat.items.map((item) => (
                        <div key={item.id}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-base font-semibold text-warm-900">{item.name}</span>
                            <span className="border-b border-dotted border-warm-300 flex-1 min-w-[20px] translate-y-[-4px]" />
                            <span className="text-base font-medium text-warm-700 tabular-nums shrink-0">
                              {item.price_cents > 0 ? `$${(item.price_cents / 100).toFixed(0)}` : ""}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-warm-500 mt-1 leading-relaxed">{item.description}</p>
                          )}
                          {item.dietary_flags && item.dietary_flags.length > 0 && (
                            <div className="flex gap-1.5 mt-2">
                              {item.dietary_flags.map((flag: string) => {
                                const info = DIETARY[flag];
                                return (
                                  <span
                                    key={flag}
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${info?.color ?? "bg-warm-100 text-warm-600"}`}
                                    title={info?.label ?? flag}
                                    role="img"
                                    aria-label={info?.label ?? flag}
                                  >
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

              {/* Dietary legend */}
              {allFlags.size > 0 && (
                <div className="mt-14 pt-6 border-t border-warm-200 flex flex-wrap gap-4 text-xs text-warm-500">
                  {[...allFlags].map((flag) => {
                    const info = DIETARY[flag];
                    return (
                      <span key={flag} className="flex items-center gap-1.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${info?.color?.split(" ")[0] ?? "bg-warm-300"}`} />
                        {info?.label ?? flag}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Hours + Contact side by side on desktop */}
        <section className="bg-white">
          <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {/* Hours */}
            {hours.length > 0 && (
              <div id="hours">
                <h2 className="font-[family-name:var(--font-display)] text-3xl text-warm-900 mb-8">Hours</h2>
                <div className="space-y-2.5">
                  {hours.map((h) => {
                    const isToday = h.day_of_week === today;
                    return (
                      <div
                        key={h.day_of_week}
                        className={`flex items-center justify-between py-1.5 ${
                          isToday ? "text-warm-900" : "text-warm-600"
                        }`}
                      >
                        <span className={`text-sm ${isToday ? "font-semibold" : ""}`}>
                          {DAYS[h.day_of_week]}
                          {isToday && (
                            <span className="ml-2 text-[11px] font-bold text-white bg-accent rounded-full px-2 py-0.5 align-middle">
                              Today
                            </span>
                          )}
                        </span>
                        {h.is_closed ? (
                          <span className="text-sm text-warm-400 italic">Closed</span>
                        ) : (
                          <span className="text-sm tabular-nums font-medium">
                            {formatTime(h.open_time)} – {formatTime(h.close_time)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact */}
            <div id="contact">
              <h2 className="font-[family-name:var(--font-display)] text-3xl text-warm-900 mb-8">Find Us</h2>
              <div className="space-y-4">
                {biz.address && (
                  <div>
                    <p className="text-base text-warm-700 font-medium">
                      {biz.address}
                    </p>
                    <p className="text-sm text-warm-500">
                      {[biz.city, biz.state, biz.zip].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="block text-base text-warm-700 hover:text-accent transition-colors">
                    {biz.phone}
                  </a>
                )}
                {biz.email && (
                  <a href={`mailto:${biz.email}`} className="block text-base text-warm-700 hover:text-accent transition-colors">
                    {biz.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-warm-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
          <div className="relative max-w-4xl mx-auto px-6 py-20 md:py-28 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-white mb-4">
              {isOpenToday ? "Join us tonight" : "Make a reservation"}
            </h2>
            <p className="text-base text-warm-400 mb-10">
              {isOpenToday && todayHours
                ? `Open today until ${formatTime(todayHours.close_time)}`
                : `${hours.filter(h => !h.is_closed).map(h => SHORT_DAYS[h.day_of_week]).join(", ")}`}
            </p>
            <Link
              href={`/r/${slug}/book`}
              className="inline-block rounded-full bg-accent px-10 py-4 text-lg font-bold text-white hover:bg-accent-light transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Reserve a Table
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-warm-900 border-t border-warm-800 py-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-[family-name:var(--font-display)] text-lg text-white">{biz.name}</span>
            {biz.address && (
              <span className="text-sm text-warm-500 ml-3">
                {biz.address}{biz.city ? `, ${biz.city}` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-warm-500">
            {biz.phone && <a href={`tel:${biz.phone}`} className="hover:text-warm-300 transition-colors">{biz.phone}</a>}
            {biz.email && <a href={`mailto:${biz.email}`} className="hover:text-warm-300 transition-colors">{biz.email}</a>}
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroText({
  biz,
  slug,
  isOpenToday,
  todayHours,
  overlay,
}: {
  biz: { name: string; cuisine: string; price_range: string; about: string; cover_image_url: string };
  slug: string;
  isOpenToday: boolean | null | undefined;
  todayHours: { open_time: string; close_time: string } | null | undefined;
  overlay: boolean;
}) {
  return (
    <>
      {(biz.cuisine || biz.price_range) && (
        <div className={`text-sm tracking-[0.2em] uppercase mb-4 ${overlay ? "text-white/60" : "text-warm-400"}`}>
          {[biz.cuisine, biz.price_range].filter(Boolean).join(" · ")}
        </div>
      )}
      <h1 className={`font-[family-name:var(--font-display)] text-5xl md:text-7xl tracking-tight ${overlay ? "text-white" : "text-white"}`}>
        {biz.name}
      </h1>
      {biz.about && biz.about.length <= 80 && (
        <p className={`mt-4 text-lg md:text-xl font-light ${overlay ? "text-white/70" : "text-warm-400"} max-w-xl`}>
          {biz.about}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href={`/r/${slug}/book`}
          className="rounded-full bg-accent px-8 py-3.5 text-base font-bold text-white hover:bg-accent-light transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Reserve a Table
        </Link>
        {isOpenToday && todayHours && (
          <span className={`text-sm font-medium ${overlay ? "text-white/50" : "text-warm-500"}`}>
            Open tonight until {formatTime(todayHours.close_time)}
          </span>
        )}
      </div>
    </>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
