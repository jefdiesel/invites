import { getVoteData } from "@/lib/queries";
import { notFound } from "next/navigation";
import { VoteForm } from "@/app/components/vote-form";

export const dynamic = "force-dynamic";

export default async function VotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getVoteData(token);

  if (!data) return notFound();

  if (data.used) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-emerald-600 text-lg">&#10003;</span>
          </div>
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Already voted</h1>
          <p className="mt-1.5 text-sm text-stone-500">Thanks {data.member.name}, your response is locked in.</p>
        </div>
      </div>
    );
  }

  const poll = data.poll as { title: string; description: string; location: string; phase: string };

  if (poll.phase !== "polling") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Poll closed</h1>
          <p className="mt-1.5 text-sm text-stone-500">This poll is no longer accepting votes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200/60 dark:border-stone-800/60 px-6 py-5">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{poll.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            {poll.location && <span className="text-xs text-stone-500">{poll.location}</span>}
            {poll.location && poll.description && <span className="text-stone-300">&#183;</span>}
            {poll.description && <span className="text-xs text-stone-400">{poll.description}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <p className="text-[13px] text-stone-500 mb-6">
          Hi <span className="font-medium text-stone-700 dark:text-stone-300">{data.member.name}</span> &#8212; mark your availability for each slot, then rank your preferences.
        </p>
        <VoteForm token={token} options={data.options} />
      </main>
    </div>
  );
}
