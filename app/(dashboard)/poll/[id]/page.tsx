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
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Poll header */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-warm-900">{p.title}</h1>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              p.phase === "polling"
                ? "text-accent bg-accent-muted"
                : p.phase === "confirming"
                ? "text-amber-600 bg-amber-500/10"
                : "text-emerald-600 bg-emerald-500/10"
            }`}>
              {p.phase === "polling" ? "Voting Open" : p.phase === "confirming" ? "Reviewing" : "Done"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-warm-500">
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
            <p className="text-sm text-warm-400 max-w-xl">{p.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/poll/${id}/edit`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-500 hover:text-warm-900 hover:bg-warm-100 transition-colors">
            Edit
          </Link>
          <Link href={`/poll/${id}/invite`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-500 hover:text-warm-900 hover:bg-warm-100 transition-colors">
            Send Invites
          </Link>
          {(p.phase === "polling" || p.phase === "confirming") && (
            <Link href={`/poll/${id}/confirm`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent-light transition-colors">
              {p.phase === "polling" ? "Close & Confirm" : "Confirm Slots"}
            </Link>
          )}
        </div>
      </div>

      {/* Voting progress */}
      {totalCount > 0 && (
        <details className="group">
          <summary className="flex items-center gap-3 cursor-pointer text-sm text-warm-500 hover:text-warm-700 transition-colors select-none">
            <span className="tabular-nums font-medium">{votedCount}/{totalCount} voted</span>
            <div className="w-24 h-1.5 rounded-full bg-warm-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${votedCount === totalCount ? "bg-emerald-500" : "bg-accent"}`}
                style={{ width: `${totalCount > 0 ? (votedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
            <span className="text-warm-300 group-open:rotate-90 transition-transform">&#9654;</span>
          </summary>
          <div className="mt-3 rounded-xl border border-warm-200 bg-white overflow-hidden">
            <div className="max-h-64 overflow-y-auto divide-y divide-warm-100">
              {p.members.map((m) => {
                const tok = p.tokens.find((t) => t.member_id === m.id);
                const voted = tok?.used_at;
                return (
                  <div key={m.id} className="flex items-center gap-3 text-sm px-4 py-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${voted ? "bg-emerald-500" : "bg-warm-300"}`} />
                    <a href={`/members/${encodeURIComponent(m.email)}`} className="text-warm-700 w-32 truncate font-medium hover:text-accent transition-colors">{m.name}</a>
                    <span className="text-warm-400 w-48 truncate">{m.email}</span>
                    {tok && !voted && (
                      <code className="text-warm-400 font-mono text-xs select-all ml-auto">/vote/{tok.token}</code>
                    )}
                    {voted && <span className="text-emerald-600 text-xs font-medium ml-auto">voted</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </details>
      )}

      <LiveResults pollId={id} />
    </main>
  );
}
