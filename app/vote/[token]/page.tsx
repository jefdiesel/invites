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
      <main className="max-w-lg mx-auto px-6 py-10">
        {/* Event info — big and clear */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{poll.title}</h1>
          {poll.location && (
            <p className="mt-1.5 text-sm text-stone-500">{poll.location}</p>
          )}
          {poll.description && (
            <p className="mt-1 text-sm text-stone-400">{poll.description}</p>
          )}
        </div>

        {/* Dates — shown upfront before any interaction */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col gap-2">
            {data.options.map((opt) => {
              const d = new Date(opt.starts_at);
              const day = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
              const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
              return (
                <div key={opt.id} className="text-lg font-semibold text-stone-800 dark:text-stone-200">
                  {opt.label || `${day} at ${time}`}
                  {opt.capacity && <span className="text-sm font-normal text-stone-400 ml-2">{opt.capacity} seats</span>}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-[13px] text-stone-500 mb-6">
          Hi <span className="font-medium text-stone-700 dark:text-stone-300">{data.member.name}</span> &#8212; which of these work for you?
        </p>

        <VoteForm token={token} options={data.options} />
      </main>
    </div>
  );
}
