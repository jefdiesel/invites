import { getPoll } from "@/lib/queries";
import { notFound } from "next/navigation";
import { EditPollForm } from "@/app/components/edit-poll-form";

export const dynamic = "force-dynamic";

export default async function EditPollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) return notFound();

  const p = poll as unknown as {
    id: string; title: string; description: string; location: string; deadline: string | null; phase: string;
    options: { id: string; label: string; starts_at: string; capacity: number | null; sort_order: number }[];
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-warm-900 dark:text-warm-100 mb-6">Edit Poll</h1>
      <EditPollForm
        pollId={p.id} initialTitle={p.title} initialDescription={p.description}
        initialLocation={p.location} initialDeadline={p.deadline} initialOptions={p.options} phase={p.phase}
      />
    </main>
  );
}
