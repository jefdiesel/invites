import { getSlotAttendees } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SlotPage({
  params,
}: {
  params: Promise<{ id: string; optionId: string }>;
}) {
  const { id, optionId } = await params;
  const data = await getSlotAttendees(id, optionId);
  if (!data) return notFound();

  const { poll, option, assigned, waitlist, allAvailable } = data;
  const hasAssignments = assigned.length > 0;
  const guestList = hasAssignments ? assigned : allAvailable;
  const spotsLeft = option.capacity ? option.capacity - assigned.length : null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur-sm bg-stone-50/80 dark:bg-stone-950/80 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center gap-3">
          <Link href={`/poll/${id}/confirm`} className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            &larr;
          </Link>
          <h1 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{option.label}</h1>
          <span className="text-xs text-stone-400">{poll.title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Slot info */}
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-stone-400">{new Date(option.starts_at).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-4 text-center">
            <div>
              <div className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-100">{guestList.length}</div>
              <div className="text-[10px] text-stone-400">{hasAssignments ? "assigned" : "available"}</div>
            </div>
            {option.capacity && (
              <div>
                <div className="text-2xl font-bold tabular-nums text-stone-400">{option.capacity}</div>
                <div className="text-[10px] text-stone-400">capacity</div>
              </div>
            )}
            {hasAssignments && spotsLeft !== null && (
              <div>
                <div className={`text-2xl font-bold tabular-nums ${spotsLeft > 0 ? "text-emerald-600" : "text-amber-600"}`}>{spotsLeft}</div>
                <div className="text-[10px] text-stone-400">spots left</div>
              </div>
            )}
          </div>
        </div>

        {/* Guest list */}
        <div>
          <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
            {hasAssignments ? "Guest List" : "Potential Guests"} ({guestList.length})
          </h2>
          {guestList.length === 0 ? (
            <p className="text-sm text-stone-400">No one assigned yet. Run assignment from the confirm page.</p>
          ) : (
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800/50">
              {guestList.map((member, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs tabular-nums text-stone-400 w-6 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{member.name}</div>
                    <div className="text-xs text-stone-400">{member.email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {member.rank !== null && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                        {member.rank}
                      </span>
                    )}
                    {member.flexibility === "inflexible" ? (
                      <span className="text-[10px] font-semibold text-rose-500">rigid</span>
                    ) : (
                      <span className="text-[10px] text-stone-300 dark:text-stone-600">flex</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waitlist (only shown if assignments exist and there's overflow) */}
        {hasAssignments && waitlist.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3">
              Waitlist ({waitlist.length})
            </h2>
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 divide-y divide-amber-100 dark:divide-amber-900/30">
              {waitlist.map((member, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs tabular-nums text-stone-400 w-6 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-700 dark:text-stone-300">{member.name}</div>
                    <div className="text-xs text-stone-400">{member.email}</div>
                  </div>
                  {member.flexibility === "inflexible" && (
                    <span className="text-[10px] font-semibold text-rose-500">rigid</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
