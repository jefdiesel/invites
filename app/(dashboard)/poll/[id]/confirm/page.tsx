import { getPollResults } from "@/lib/queries";
import { notFound } from "next/navigation";
import { ConfirmUI } from "@/app/components/confirm-ui";

export const dynamic = "force-dynamic";

export default async function ConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const results = await getPollResults(id);
  if (!results) return notFound();

  const poll = results.poll as { id: string; title: string; phase: string };

  const optionsWithStats = results.options.map((opt) => ({
    id: opt.id, label: opt.label, starts_at: opt.starts_at, capacity: opt.capacity,
    confirmed: opt.confirmed, sort_order: opt.sort_order, available: opt.available,
    unable: opt.unable, onlyOption: opt.onlyOption, bordaScore: opt.bordaScore, assignedCount: opt.assignedCount,
  }));

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-warm-900">Confirm Slots</h1>
        <span className="text-sm text-warm-400">{poll.title}</span>
      </div>
      <ConfirmUI pollId={id} initialOptions={optionsWithStats} phase={poll.phase} totalResponses={results.votedCount} hasOffers={results.hasOffers} />
    </main>
  );
}
