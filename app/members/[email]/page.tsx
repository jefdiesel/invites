import { getMemberHistory } from "@/lib/member-queries";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MemberPage({ params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);
  const history = await getMemberHistory(decodedEmail);

  if (history.polls.length === 0) return notFound();

  const memberName = history.polls[0]?.poll ? history.polls[0].poll.title : "";
  // Get the name from the first poll's roster
  const name = history.polls[0] ? decodedEmail : decodedEmail;

  // Get real name from roster_members
  const { supabase } = await import("@/lib/db");
  const { data: rosterEntry } = await supabase
    .from("roster_members")
    .select("name")
    .eq("email", decodedEmail)
    .limit(1)
    .single();

  const displayName = rosterEntry?.name ?? decodedEmail.split("@")[0];
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  // Stats
  const totalPolls = history.polls.length;
  const voted = history.polls.filter((p) => p.response_type === "voted").length;
  const assigned = history.polls.filter((p) => p.assigned_to.length > 0).length;
  const notInterested = history.polls.filter((p) => p.response_type === "not_interested").length;
  const responseRate = totalPolls > 0 ? Math.round(((voted + notInterested) / totalPolls) * 100) : 0;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Bio header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-accent-muted flex items-center justify-center shrink-0">
          <span className="text-accent font-bold text-xl">{initials}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">{displayName}</h1>
          <p className="text-base text-warm-400 mt-0.5">{decodedEmail}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-4 text-center">
          <div className="text-2xl font-bold tabular-nums text-warm-900 dark:text-warm-100">{totalPolls}</div>
          <div className="text-sm text-warm-400 mt-0.5">polls</div>
        </div>
        <div className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-4 text-center">
          <div className="text-2xl font-bold tabular-nums text-accent">{voted}</div>
          <div className="text-sm text-warm-400 mt-0.5">voted</div>
        </div>
        <div className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-4 text-center">
          <div className="text-2xl font-bold tabular-nums text-emerald-600">{assigned}</div>
          <div className="text-sm text-warm-400 mt-0.5">assigned</div>
        </div>
        <div className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-4 text-center">
          <div className="text-2xl font-bold tabular-nums text-warm-900 dark:text-warm-100">{responseRate}%</div>
          <div className="text-sm text-warm-400 mt-0.5">response rate</div>
        </div>
      </div>

      {/* Poll history */}
      <h2 className="text-sm font-bold text-warm-600 dark:text-warm-400 uppercase tracking-wider mb-3">Poll History</h2>
      <div className="space-y-2 mb-8">
        {history.polls.map((entry) => (
          <Link
            key={entry.poll.id}
            href={`/poll/${entry.poll.id}`}
            className="flex items-center gap-4 rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-4 hover:border-warm-300 dark:hover:border-warm-700 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-warm-900 dark:text-warm-100 group-hover:text-accent transition-colors">
                {entry.poll.title}
              </div>
              <div className="text-sm text-warm-400 mt-0.5">
                {entry.poll.location && `${entry.poll.location} · `}
                {new Date(entry.poll.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {entry.response_type === "voted" && (
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Voted ({entry.dates_available}/{entry.dates_total} dates)
                </span>
              )}
              {entry.response_type === "not_interested" && (
                <span className="text-sm font-medium text-warm-400">Not interested</span>
              )}
              {entry.response_type === "none_work" && (
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">No dates work</span>
              )}
              {entry.response_type === "no_response" && (
                <span className="text-sm text-warm-300 dark:text-warm-600">No response</span>
              )}
              {entry.assigned_to.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Seated: {entry.assigned_to.join(", ")}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Events attended */}
      {history.events.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-warm-600 dark:text-warm-400 uppercase tracking-wider mb-3">Events Attended</h2>
          <div className="space-y-2 mb-8">
            {history.events.map((event) => {
              const review = history.reviews.find((r) => r.event_id === event.id);
              const ticket = history.tickets.find((t) => t.event_id === event.id);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center gap-4 rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-4 hover:border-warm-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-warm-900 dark:text-warm-100">{event.title}</div>
                    <div className="text-sm text-warm-400 mt-0.5">
                      {event.location && `${event.location} · `}
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {review && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`text-sm ${i < review.stars ? "text-amber-400" : "text-warm-200 dark:text-warm-700"}`}>&#9733;</span>
                        ))}
                      </div>
                    )}
                    {ticket && (
                      <span className="text-sm text-warm-400">
                        {ticket.quantity} ticket{ticket.quantity > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Ticket purchases */}
      {history.tickets.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-warm-600 dark:text-warm-400 uppercase tracking-wider mb-3">Ticket Purchases</h2>
          <div className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 divide-y divide-warm-100 dark:divide-warm-800/50 mb-8">
            {history.tickets.map((ticket) => {
              const event = history.events.find((e) => e.id === ticket.event_id);
              return (
                <div key={ticket.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-warm-900 dark:text-warm-100">{event?.title ?? "Unknown Event"}</div>
                    <div className="text-sm text-warm-400">{new Date(ticket.purchased_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm font-medium text-warm-900 dark:text-warm-100 tabular-nums">
                    {ticket.quantity} x ${(ticket.amount_cents / 100).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Reviews */}
      {history.reviews.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-warm-600 dark:text-warm-400 uppercase tracking-wider mb-3">Reviews</h2>
          <div className="space-y-3">
            {history.reviews.map((review) => {
              const event = history.events.find((e) => e.id === review.event_id);
              return (
                <div key={review.id} className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-sm font-semibold text-warm-900 dark:text-warm-100">{event?.title ?? "Unknown Event"}</div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`text-sm ${i < review.stars ? "text-amber-400" : "text-warm-200 dark:text-warm-700"}`}>&#9733;</span>
                      ))}
                    </div>
                    <span className="text-sm text-warm-400">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.body && <p className="text-sm text-warm-600 dark:text-warm-300 leading-relaxed">{review.body}</p>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
