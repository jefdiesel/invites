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
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-emerald-600 text-xl">&#10003;</span>
          </div>
          <h1 className="text-xl font-bold text-warm-900 dark:text-warm-100">Already voted</h1>
          <p className="mt-2 text-base text-warm-500">Thanks {data.member.name}, your response is locked in.</p>
        </div>
      </div>
    );
  }

  const poll = data.poll as { title: string; description: string; location: string; phase: string };

  if (poll.phase !== "polling") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold text-warm-900 dark:text-warm-100">Poll closed</h1>
          <p className="mt-2 text-base text-warm-500">This poll is no longer accepting votes.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">{poll.title}</h1>
        {poll.location && <p className="mt-1.5 text-base text-warm-500">{poll.location}</p>}
        {poll.description && <p className="mt-1 text-sm text-warm-400">{poll.description}</p>}
        <p className="mt-5 text-lg font-semibold text-warm-800 dark:text-warm-200">
          Hi {data.member.name} &#8212; tap the dates you can make.
        </p>
        <p className="mt-1 text-base text-warm-500">
          First tap = top choice. Tap more to rank them.
        </p>
      </div>
      <VoteForm token={token} options={data.options} />
    </main>
  );
}
