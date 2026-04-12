import { getPollResults } from "@/lib/queries";
import { notFound } from "next/navigation";
import { ConfirmUI } from "@/app/components/confirm-ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const results = await getPollResults(id);
  if (!results) return notFound();

  const poll = results.poll as { id: string; title: string; phase: string };

  const optionsWithStats = results.options.map((opt) => ({
    id: opt.id,
    label: opt.label,
    starts_at: opt.starts_at,
    capacity: opt.capacity,
    confirmed: opt.confirmed,
    sort_order: opt.sort_order,
    available: opt.available,
    unable: opt.unable,
    onlyOption: opt.onlyOption,
    bordaScore: opt.bordaScore,
    assignedCount: opt.assignedCount,
  }));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur-sm bg-stone-50/80 dark:bg-stone-950/80 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center gap-3">
          <Link href={`/poll/${id}`} className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            &larr;
          </Link>
          <h1 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Confirm Slots</h1>
          <span className="text-xs text-stone-400">{poll.title}</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <ConfirmUI
          pollId={id}
          initialOptions={optionsWithStats}
          phase={poll.phase}
          totalResponses={results.votedCount}
          hasOffers={results.hasOffers}
        />
      </main>
    </div>
  );
}
