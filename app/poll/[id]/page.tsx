import { getPoll } from "@/lib/queries";
import { notFound } from "next/navigation";
import { LiveResults } from "@/app/components/live-results";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) return notFound();

  const p = poll as unknown as {
    id: string; title: string; description: string; location: string; deadline: string | null; phase: string;
    tokens: { token: string; member_id: string; used_at: string | null }[];
    members: { id: string; name: string; email: string }[];
  };

  const votedCount = p.tokens.filter((t) => t.used_at).length;
  const totalCount = p.tokens.length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur-sm bg-stone-50/80 dark:bg-stone-950/80 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors shrink-0 px-1">
              &larr;
            </Link>
            <h1 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{p.title}</h1>
            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              p.phase === "polling"
                ? "text-indigo-600 bg-indigo-500/10 dark:text-indigo-400"
                : p.phase === "confirming"
                ? "text-amber-600 bg-amber-500/10 dark:text-amber-400"
                : "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
            }`}>
              {p.phase === "polling" ? "Voting Open" : p.phase === "confirming" ? "Reviewing" : "Done"}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/poll/${id}/edit`}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Edit
            </Link>
            {(p.phase === "polling" || p.phase === "confirming") && (
              <Link
                href={`/poll/${id}/confirm`}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                {p.phase === "polling" ? "Close & Confirm" : "Confirm Slots"}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Event info */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">{p.title}</h2>
            <div className="flex items-center gap-3 text-sm text-stone-500">
              {p.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {p.location}
                </span>
              )}
              {p.deadline && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Votes by {new Date(p.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
            {p.description && (
              <p className="text-[13px] text-stone-400 max-w-xl">{p.description}</p>
            )}
          </div>
        </div>

        {/* Voting links */}
        {totalCount > 0 && (
          <details className="group">
            <summary className="flex items-center gap-3 cursor-pointer text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors select-none">
              <span className="tabular-nums">{votedCount}/{totalCount} voted</span>
              <div className="w-24 h-1 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${votedCount === totalCount ? "bg-emerald-500" : "bg-indigo-500"}`}
                  style={{ width: `${totalCount > 0 ? (votedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-stone-300 dark:text-stone-600 group-open:rotate-90 transition-transform">&#9654;</span>
            </summary>
            <div className="mt-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
              <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/50">
                {p.members.map((m) => {
                  const tok = p.tokens.find((t) => t.member_id === m.id);
                  const voted = tok?.used_at;
                  return (
                    <div key={m.id} className="flex items-center gap-3 text-xs px-4 py-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${voted ? "bg-emerald-500" : "bg-stone-300 dark:bg-stone-600"}`} />
                      <span className="text-stone-700 dark:text-stone-300 w-28 truncate">{m.name}</span>
                      <span className="text-stone-400 w-44 truncate">{m.email}</span>
                      {tok && !voted && (
                        <code className="text-stone-400 font-mono text-[10px] select-all ml-auto">/vote/{tok.token}</code>
                      )}
                      {voted && <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium ml-auto">voted</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </details>
        )}

        <LiveResults pollId={id} />
      </main>
    </div>
  );
}
