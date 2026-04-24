import Link from "next/link";

export default function PhotoDescriptionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="font-[family-name:var(--font-display)] text-2xl text-neutral-900">Remi</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-neutral-900 mb-8">
          Why photo descriptions matter
        </h1>

        <div className="space-y-8 text-base text-neutral-600 leading-relaxed">
          <p className="text-lg text-neutral-900 font-medium">
            Every photo on your website needs a description. This isn't optional — it's the law, and it protects your business.
          </p>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">The legal requirement</h2>
            <p>
              The Americans with Disabilities Act (ADA) Title III requires businesses open to the public — including restaurants — to make their websites accessible to people with disabilities. The Web Content Accessibility Guidelines (WCAG) 2.2 Level AA is the standard courts use to evaluate compliance.
            </p>
            <p className="mt-3">
              <strong>WCAG Success Criterion 1.1.1 (Non-text Content)</strong> requires that all images have text alternatives that serve the same purpose. A missing or vague description like "image" or "photo" is a violation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">The risk</h2>
            <p>
              ADA web accessibility lawsuits have increased every year. In 2025, over 4,000 federal lawsuits were filed against businesses with inaccessible websites. Restaurants are among the most targeted industries. Settlements typically range from $5,000 to $25,000 per claim, plus attorney fees.
            </p>
            <p className="mt-3">
              Many of these lawsuits cite missing image descriptions as a primary barrier. A single restaurant website with 20 photos and no descriptions = 20 documented violations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">Who this helps</h2>
            <p>
              Over 7 million Americans have a visual disability. When a blind person visits your restaurant's website using a screen reader, the software reads your photo descriptions aloud. Without them, the person hears "image" or nothing — they can't tell if they're looking at your dining room, your menu, or your parking lot.
            </p>
            <p className="mt-3">
              Good descriptions also help people with cognitive disabilities, people on slow connections who can't load images, and search engines trying to understand your content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">How to write a good description</h2>
            <p className="mb-4">Describe what a person would see if they were standing in front of the scene. Be specific and concise.</p>
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 text-sm font-bold text-neutral-600 bg-neutral-50 border-b border-neutral-200">
                <div className="px-4 py-3 border-r border-neutral-200 text-rose-600">Bad</div>
                <div className="px-4 py-3 text-emerald-700">Good</div>
              </div>
              <div className="grid grid-cols-2 text-sm border-b border-neutral-100">
                <div className="px-4 py-3 border-r border-neutral-100 text-neutral-400">"Food"</div>
                <div className="px-4 py-3 text-neutral-700">"A seared salmon fillet on a bed of lentils with herb butter, served on a white plate"</div>
              </div>
              <div className="grid grid-cols-2 text-sm border-b border-neutral-100">
                <div className="px-4 py-3 border-r border-neutral-100 text-neutral-400">"Interior"</div>
                <div className="px-4 py-3 text-neutral-700">"The dining room at evening service with candlelit tables, exposed brick walls, and warm amber lighting"</div>
              </div>
              <div className="grid grid-cols-2 text-sm border-b border-neutral-100">
                <div className="px-4 py-3 border-r border-neutral-100 text-neutral-400">"Team photo"</div>
                <div className="px-4 py-3 text-neutral-700">"Chef Maria plating a dish in the open kitchen under pendant lights"</div>
              </div>
              <div className="grid grid-cols-2 text-sm">
                <div className="px-4 py-3 border-r border-neutral-100 text-neutral-400">"IMG_4392.jpg"</div>
                <div className="px-4 py-3 text-neutral-700">"A glass of red wine on a white tablecloth with soft candlelight in the background"</div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-3">Why we require 30 characters</h2>
            <p>
              A meaningful description can't be written in fewer than 30 characters. "A plate of food" is 15 characters and tells a blind person nothing useful. "Pan-seared salmon with lentils du Puy on a white ceramic plate" is 62 characters and paints a picture. The 30-character minimum ensures every photo on your site is genuinely accessible.
            </p>
          </section>

          <section className="border-t border-neutral-200 pt-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-3">Remi handles the rest</h2>
            <p>
              Your photo descriptions are the one thing we can't automate — only you know what's in your photos. Everything else (contrast ratios, keyboard navigation, screen reader landmarks, semantic HTML) is built into every Remi site automatically. Your job is to describe your photos. We handle the other 50+ accessibility requirements.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
