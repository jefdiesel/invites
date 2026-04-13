import { getSlotAttendees } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SlotPage({ params }: { params: Promise<{ id: string; optionId: string }> }) {
  const { id, optionId } = await params;
  const data = await getSlotAttendees(id, optionId);
  if (!data) return notFound();

  const { poll, option, assigned, waitlist, allAvailable } = data;
  if (!poll) return notFound();
  const hasAssignments = assigned.length > 0;
  const guestList = hasAssignments ? assigned : allAvailable;
  const spotsLeft = option.capacity ? option.capacity - assigned.length : null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href={`/poll/${id}/confirm`} className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr;</Link>
        <h1 className="text-xl font-bold text-warm-900">{option.label}</h1>
        <span className="text-sm text-warm-400">{poll.title}</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-sm text-warm-400">{new Date(option.starts_at).toLocaleString()}</div>
        <div className="flex items-center gap-4 text-center">
          <div>
            <div className="text-2xl font-bold tabular-nums text-warm-900">{guestList.length}</div>
            <div className="text-xs text-warm-400">{hasAssignments ? "assigned" : "available"}</div>
          </div>
          {option.capacity && (
            <div>
              <div className="text-2xl font-bold tabular-nums text-warm-400">{option.capacity}</div>
              <div className="text-xs text-warm-400">capacity</div>
            </div>
          )}
          {hasAssignments && spotsLeft !== null && (
            <div>
              <div className={`text-2xl font-bold tabular-nums ${spotsLeft > 0 ? "text-emerald-600" : "text-amber-600"}`}>{spotsLeft}</div>
              <div className="text-xs text-warm-400">spots left</div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-warm-600 uppercase tracking-wider mb-3">
          {hasAssignments ? "Guest List" : "Potential Guests"} ({guestList.length})
        </h2>
        {guestList.length === 0 ? (
          <p className="text-sm text-warm-400">No one assigned yet. Run assignment from the confirm page.</p>
        ) : (
          <div className="rounded-xl border border-warm-200 bg-white divide-y divide-warm-100">
            {guestList.map((member, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm tabular-nums text-warm-400 w-6 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <a href={`/members/${encodeURIComponent(member.email)}`} className="text-sm font-semibold text-warm-900 hover:text-accent transition-colors">{member.name}</a>
                  <div className="text-sm text-warm-400">{member.email}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {member.rank !== null && (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-muted text-accent text-xs font-bold">{member.rank}</span>
                  )}
                  {member.flexibility === "inflexible" ? (
                    <span className="text-xs font-semibold text-rose-500">rigid</span>
                  ) : (
                    <span className="text-xs text-warm-300">flex</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasAssignments && waitlist.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3">Waitlist ({waitlist.length})</h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50/30 divide-y divide-amber-100">
            {waitlist.map((member, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm tabular-nums text-warm-400 w-6 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-warm-700">{member.name}</div>
                  <div className="text-sm text-warm-400">{member.email}</div>
                </div>
                {member.flexibility === "inflexible" && <span className="text-xs font-semibold text-rose-500">rigid</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
