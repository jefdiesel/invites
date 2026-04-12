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
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur-sm bg-stone-50/80 dark:bg-stone-950/80 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center">
          <span className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">Club Poll</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {polls.length === 0 ? (
          <div className="space-y-10">
            <div className="max-w-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                Plan your next event
              </h2>
              <p className="mt-2 text-[13px] text-stone-500 leading-relaxed">
                Create a poll with candidate dates, invite members to vote,
                then confirm which slots to run.
              </p>
              <div className="mt-5 flex gap-5 text-xs text-stone-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center">1</span>
                  Poll
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center">2</span>
                  Vote
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center">3</span>
                  Confirm
                </span>
              </div>
            </div>
            <NewPollForm action={createPoll} />
          </div>
        ) : (
          <div className="space-y-6">
            {polls.map((poll) => {
              const pct = poll.member_count > 0
                ? Math.round((poll.response_count / poll.member_count) * 100)
                : 0;
              return (
                <div
                  key={poll.id}
                  className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/poll/${poll.id}`}
                          className="text-[15px] font-semibold text-stone-900 dark:text-stone-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                        >
                          {poll.title}
                        </Link>
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          poll.phase === "polling"
                            ? "text-indigo-600 bg-indigo-500/10 dark:text-indigo-400"
                            : poll.phase === "confirming"
                            ? "text-amber-600 bg-amber-500/10 dark:text-amber-400"
                            : "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
                        }`}>
                          {poll.phase === "polling" ? "Voting Open" : poll.phase === "confirming" ? "Reviewing" : "Done"}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="w-32 h-1 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct === 100 ? "bg-emerald-500" : "bg-indigo-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-stone-400">
                          {poll.response_count}/{poll.member_count} voted
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/poll/${poll.id}/invite`}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                      >
                        Invites
                      </Link>
                      <Link
                        href={`/poll/${poll.id}`}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        Results
                      </Link>
                      <Link
                        href={`/poll/${poll.id}/confirm`}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
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
    </div>
  );
}
