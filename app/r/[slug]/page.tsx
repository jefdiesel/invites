import { getBusiness, getBusinessHours, getMenuItems } from "@/lib/restaurant-queries";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const hours = await getBusinessHours(biz.id);
  const menu = await getMenuItems(biz.id);

  // Group menu by category
  const categories = [...new Set(menu.map((m) => m.category))];
  const menuByCategory = categories.map((cat) => ({
    category: cat,
    items: menu.filter((m) => m.category === cat),
  }));

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Hero */}
      <header className="bg-warm-900 text-white">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          {biz.price_range && (
            <div className="text-warm-400 text-sm tracking-widest uppercase mb-2">{biz.cuisine} · {biz.price_range}</div>
          )}
          <h1 className="text-4xl font-bold tracking-tight">{biz.name}</h1>
          {biz.about && (
            <p className="mt-4 text-base text-warm-300 max-w-lg mx-auto leading-relaxed">{biz.about}</p>
          )}
          <div className="mt-8">
            <Link
              href={`/r/${slug}/book`}
              className="inline-block rounded-lg bg-accent px-8 py-3 text-base font-bold text-white hover:bg-accent-light transition-colors"
            >
              Reserve a Table
            </Link>
          </div>
        </div>
      </header>

      {/* Info bar */}
      <div className="border-b border-warm-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between text-sm text-warm-600">
          <div className="flex items-center gap-4">
            {biz.address && <span>{biz.address}{biz.city ? `, ${biz.city}` : ""}{biz.state ? ` ${biz.state}` : ""}</span>}
            {biz.phone && <span>{biz.phone}</span>}
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/r/${slug}/book`} className="font-semibold text-accent hover:text-accent-light transition-colors">Book</Link>
            <a href="#menu" className="hover:text-warm-900 transition-colors">Menu</a>
            <a href="#hours" className="hover:text-warm-900 transition-colors">Hours</a>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Menu */}
        {menuByCategory.length > 0 && (
          <section id="menu" className="mb-16">
            <h2 className="text-2xl font-bold text-warm-900 mb-8">Menu</h2>
            {menuByCategory.map((cat) => (
              <div key={cat.category} className="mb-10">
                <h3 className="text-sm font-bold text-warm-500 uppercase tracking-wider mb-4">{cat.category}</h3>
                <div className="space-y-4">
                  {cat.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-warm-900">
                          {item.name}
                          {item.dietary_flags && item.dietary_flags.length > 0 && (
                            <span className="ml-2 text-xs text-warm-400">{item.dietary_flags.join(" · ")}</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-warm-500 mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <span className="text-base font-medium text-warm-700 tabular-nums shrink-0">
                        ${(item.price_cents / 100).toFixed(0)}
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
          <section id="hours" className="mb-16">
            <h2 className="text-2xl font-bold text-warm-900 mb-6">Hours</h2>
            <div className="border border-warm-200 rounded-lg bg-white divide-y divide-warm-100">
              {hours.map((h) => (
                <div key={h.day_of_week} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-medium text-warm-700">{DAYS[h.day_of_week]}</span>
                  {h.is_closed ? (
                    <span className="text-sm text-warm-400">Closed</span>
                  ) : (
                    <span className="text-sm text-warm-600 tabular-nums">
                      {formatTime(h.open_time)} – {formatTime(h.close_time)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-warm-900 mb-6">Contact</h2>
          <div className="border border-warm-200 rounded-lg bg-white p-5 space-y-2">
            {biz.address && (
              <p className="text-sm text-warm-700">{biz.address}{biz.city ? `, ${biz.city}` : ""}{biz.state ? ` ${biz.state}` : ""} {biz.zip}</p>
            )}
            {biz.phone && <p className="text-sm text-warm-700">{biz.phone}</p>}
            {biz.email && <p className="text-sm text-warm-700">{biz.email}</p>}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href={`/r/${slug}/book`}
            className="inline-block rounded-lg bg-accent px-8 py-3 text-base font-bold text-white hover:bg-accent-light transition-colors"
          >
            Reserve a Table
          </Link>
        </div>
      </main>

      <footer className="border-t border-warm-200 py-8 text-center text-sm text-warm-400">
        {biz.name} · Powered by {biz.name}
      </footer>
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
