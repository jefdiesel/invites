import { getPoll } from "@/lib/queries";
import { notFound } from "next/navigation";
import { EditPollForm } from "@/app/components/edit-poll-form";
import Link from "next/link";

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur-sm bg-stone-50/80 dark:bg-stone-950/80 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center gap-3">
          <Link href={`/poll/${id}`} className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            &larr;
          </Link>
          <h1 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Edit Poll</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <EditPollForm
          pollId={p.id}
          initialTitle={p.title}
          initialDescription={p.description}
          initialLocation={p.location}
          initialDeadline={p.deadline}
          initialOptions={p.options}
          phase={p.phase}
        />
      </main>
    </div>
  );
}
