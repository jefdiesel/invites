import { getBusiness, getBusinessHours, getMenuItems } from "@/lib/restaurant-queries";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  // Today's hours for the hero
  const today = new Date().getDay();
  const todayHours = hours.find((h) => h.day_of_week === today);
  const isOpenToday = todayHours && !todayHours.is_closed;

  return (
    <div className="min-h-screen bg-warm-50 scroll-pt-14">
      {/* Skip to content — visible on keyboard focus (WCAG 2.4.1) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-warm-900 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>

      {/* Primary navigation — first in DOM for focus order (WCAG 2.4.3) */}
      <nav aria-label={`${biz.name} navigation`} className="sticky top-0 z-40 bg-warm-900/95 backdrop-blur border-b border-warm-800">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between h-14">
          <a href={`/r/${slug}`} className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded">
            {biz.logo_url ? (
              <img src={biz.logo_url} alt="" className="h-8 w-auto" />
            ) : null}
            <span className="text-lg font-bold tracking-tight text-white">{biz.name}</span>
          </a>
          <div className="flex items-center gap-6 text-sm">
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
        </div>
      </nav>

      {/* Hero — below nav in DOM, visually prominent */}
      <header className="relative">
        {biz.cover_image_url ? (
          <div className="h-[420px] relative">
            <img
              src={biz.cover_image_url}
              alt={biz.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            <div className="relative z-10 h-full flex flex-col justify-end max-w-3xl mx-auto px-6 pb-12">
              <HeroContent biz={biz} slug={slug} isOpenToday={isOpenToday} todayHours={todayHours} />
            </div>
          </div>
        ) : (
          <div className="bg-warm-900 text-white">
            <div className="max-w-3xl mx-auto px-6 py-20">
              <HeroContent biz={biz} slug={slug} isOpenToday={isOpenToday} todayHours={todayHours} />
            </div>
          </div>
        )}
      </header>

      <main id="main" className="max-w-3xl mx-auto px-6">
        {/* About — if there's a longer description */}
        {biz.about && biz.about.length > 60 && (
          <section className="py-16 border-b border-warm-200">
            <p className="text-lg text-warm-700 leading-relaxed max-w-xl">
              {biz.about}
            </p>
          </section>
        )}

        {/* Menu */}
        {menuByCategory.length > 0 && (
          <section id="menu" className="py-16 border-b border-warm-200">
            <h2 className="text-sm font-bold text-warm-400 uppercase tracking-widest mb-10">Menu</h2>
            {menuByCategory.map((cat, catIdx) => (
              <div key={cat.category} className={catIdx > 0 ? "mt-12" : ""}>
                <h3 className="text-xl font-bold text-warm-900 mb-6">{cat.category}</h3>
                <div className="space-y-5">
                  {cat.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-warm-900">
                          {item.name}
                          {item.dietary_flags && item.dietary_flags.length > 0 && (
                            <span className="ml-2 text-xs font-medium text-warm-400">
                              {item.dietary_flags.join(" · ")}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-warm-500 mt-1">{item.description}</p>
                        )}
                      </div>
                      <span className="text-base font-medium text-warm-700 tabular-nums shrink-0">
                        {item.price_cents > 0 ? `$${(item.price_cents / 100).toFixed(0)}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Hours */}
        {hours.length > 0 && (
          <section id="hours" className="py-16 border-b border-warm-200">
            <h2 className="text-sm font-bold text-warm-400 uppercase tracking-widest mb-10">Hours</h2>
            <div className="grid grid-cols-1 gap-3">
              {hours.map((h) => {
                const isToday = h.day_of_week === today;
                return (
                  <div
                    key={h.day_of_week}
                    className={`flex items-center justify-between py-2 ${
                      isToday ? "text-warm-900 font-semibold" : "text-warm-600"
                    }`}
                  >
                    <span className="text-sm">
                      {DAYS[h.day_of_week]}
                      {isToday && <span className="ml-2 text-xs text-accent font-bold">Today</span>}
                    </span>
                    {h.is_closed ? (
                      <span className="text-sm text-warm-400">Closed</span>
                    ) : (
                      <span className="text-sm tabular-nums">
                        {formatTime(h.open_time)} – {formatTime(h.close_time)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Contact / Location */}
        <section id="contact" className="py-16 border-b border-warm-200">
          <h2 className="text-sm font-bold text-warm-400 uppercase tracking-widest mb-10">Find Us</h2>
          <div className="space-y-3">
            {biz.address && (
              <p className="text-base text-warm-700">
                {biz.address}
                {biz.city && <>, {biz.city}</>}
                {biz.state && <> {biz.state}</>}
                {biz.zip && <> {biz.zip}</>}
              </p>
            )}
            {biz.phone && (
              <p>
                <a href={`tel:${biz.phone}`} className="text-base text-warm-700 hover:text-accent transition-colors">
                  {biz.phone}
                </a>
              </p>
            )}
            {biz.email && (
              <p>
                <a href={`mailto:${biz.email}`} className="text-base text-warm-700 hover:text-accent transition-colors">
                  {biz.email}
                </a>
              </p>
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 text-center">
          <h2 className="text-2xl font-bold text-warm-900 mb-3">Ready to join us?</h2>
          <p className="text-base text-warm-500 mb-8">
            {isOpenToday
              ? `Open today until ${formatTime(todayHours!.close_time)}`
              : "Check our hours for availability"}
          </p>
          <Link
            href={`/r/${slug}/book`}
            className="inline-block rounded-full bg-accent px-10 py-3.5 text-base font-bold text-white hover:bg-accent-light transition-colors"
          >
            Reserve a Table
          </Link>
        </section>
      </main>

      <footer className="border-t border-warm-200 bg-white py-10 text-center">
        <div className="text-sm text-warm-400">
          {biz.name}
          {biz.address && <> · {biz.address}</>}
          {biz.city && <>, {biz.city}</>}
        </div>
        {hours.length > 0 && (
          <div className="text-xs text-warm-300 mt-2">
            {hours.filter(h => !h.is_closed).map(h => SHORT_DAYS[h.day_of_week]).join(", ")}
            {" · "}
            {formatTime(hours.find(h => !h.is_closed)?.open_time ?? "17:00")} – {formatTime(hours.find(h => !h.is_closed)?.close_time ?? "22:00")}
          </div>
        )}
      </footer>
    </div>
  );
}

function HeroContent({
  biz,
  slug,
  isOpenToday,
  todayHours,
}: {
  biz: { name: string; cuisine: string; price_range: string; about: string; cover_image_url: string };
  slug: string;
  isOpenToday: boolean | null | undefined;
  todayHours: { open_time: string; close_time: string } | null | undefined;
}) {
  const hasImage = !!biz.cover_image_url;
  return (
    <>
      {(biz.cuisine || biz.price_range) && (
        <div className={`text-sm tracking-widest uppercase mb-3 ${hasImage ? "text-white/70" : "text-warm-400"}`}>
          {[biz.cuisine, biz.price_range].filter(Boolean).join(" · ")}
        </div>
      )}
      <h1 className={`text-5xl font-bold tracking-tight ${hasImage ? "text-white" : ""}`}>
        {biz.name}
      </h1>
      {biz.about && biz.about.length <= 60 && (
        <p className={`mt-3 text-lg ${hasImage ? "text-white/80" : "text-warm-300"}`}>
          {biz.about}
        </p>
      )}
      <div className="mt-6 flex items-center gap-4">
        <Link
          href={`/r/${slug}/book`}
          className="rounded-full bg-accent px-8 py-3 text-base font-bold text-white hover:bg-accent-light transition-colors"
        >
          Reserve a Table
        </Link>
        {isOpenToday && todayHours && (
          <span className={`text-sm ${hasImage ? "text-white/60" : "text-warm-400"}`}>
            Open today · {formatTime(todayHours.close_time)}
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
