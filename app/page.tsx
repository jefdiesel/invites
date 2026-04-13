import { getPolls } from "@/lib/queries";
import { createPoll, addMembers } from "@/lib/actions";
import Link from "next/link";
import { NewPollForm } from "@/app/components/new-poll-form";
import { AddMembersForm } from "@/app/components/add-members-form";
import { DeletePollButton } from "@/app/components/delete-poll-button";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const polls = await getPolls();

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {polls.length === 0 ? (
        <div className="space-y-10">
          <div className="max-w-sm">
            <h2 className="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-100">
              Plan your next event
            </h2>
            <p className="mt-2 text-sm text-warm-500 leading-relaxed">
              Create a poll with candidate dates, invite members to vote,
              then confirm which slots to run.
            </p>
            <div className="mt-5 flex gap-5 text-sm text-warm-400">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-accent-muted text-accent text-xs font-bold flex items-center justify-center">1</span>
                Poll
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-accent-muted text-accent text-xs font-bold flex items-center justify-center">2</span>
                Vote
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-accent-muted text-accent text-xs font-bold flex items-center justify-center">3</span>
                Confirm
              </span>
            </div>
          </div>
          <NewPollForm action={createPoll} />
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-warm-900 dark:text-warm-100">Polls</h2>
          {polls.map((poll) => {
            const pct = poll.member_count > 0
              ? Math.round((poll.response_count / poll.member_count) * 100)
              : 0;
            return (
              <div
                key={poll.id}
                className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-5 hover:border-warm-300 dark:hover:border-warm-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/poll/${poll.id}`}
                        className="text-base font-semibold text-warm-900 dark:text-warm-100 hover:text-accent transition-colors truncate"
                      >
                        {poll.title}
                      </Link>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        poll.phase === "polling"
                          ? "text-accent bg-accent-muted"
                          : poll.phase === "confirming"
                          ? "text-amber-600 bg-amber-500/10 dark:text-amber-400"
                          : "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
                      }`}>
                        {poll.phase === "polling" ? "Voting Open" : poll.phase === "confirming" ? "Reviewing" : "Done"}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="w-32 h-1.5 rounded-full bg-warm-100 dark:bg-warm-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct === 100 ? "bg-emerald-500" : "bg-accent"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm tabular-nums text-warm-500">
                        {poll.response_count}/{poll.member_count} voted
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/poll/${poll.id}/invite`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-muted transition-colors"
                    >
                      Invites
                    </Link>
                    <Link
                      href={`/poll/${poll.id}`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-500 hover:text-warm-900 dark:hover:text-warm-100 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
                    >
                      Results
                    </Link>
                    <Link
                      href={`/poll/${poll.id}/confirm`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-500 hover:text-warm-900 dark:hover:text-warm-100 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
                    >
                      Confirm
                    </Link>
                    <DeletePollButton pollId={poll.id} />
                  </div>
                </div>

                <AddMembersForm pollId={poll.id} action={addMembers} memberCount={poll.member_count} />
              </div>
            );
          })}

          <NewPollForm action={createPoll} />
        </div>
      )}
    </main>
  );
}
