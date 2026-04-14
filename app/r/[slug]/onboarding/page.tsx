import { getBusiness, getBusinessHours, getMenuItems, getTableInventory } from "@/lib/restaurant-queries";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { OnboardingWizard } from "@/app/components/onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireAuth(slug, "admin");

  const biz = await getBusiness(slug);
  if (!biz) return notFound();

  const [hours, inventory, menu] = await Promise.all([
    getBusinessHours(biz.id),
    getTableInventory(biz.id),
    getMenuItems(biz.id, true),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-[family-name:var(--font-display)] text-xl text-neutral-900">{biz.name}</span>
          <a href={`/r/${slug}/admin`} className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
            Skip to dashboard
          </a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <OnboardingWizard
          business={biz}
          slug={slug}
          existingHours={hours}
          existingInventory={inventory}
          existingMenu={menu}
        />
      </main>
    </div>
  );
}
