import { getMembers } from "@/lib/member-queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">Members</h1>
        <span className="text-sm text-warm-400">{members.length} total</span>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-10 text-center">
          <p className="text-base text-warm-500">No members yet. Add members to a poll to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((m) => (
            <Link
              key={m.id}
              href={`/members/${encodeURIComponent(m.email)}`}
              className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-5 hover:border-warm-300 dark:hover:border-warm-700 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center shrink-0">
                  <span className="text-accent font-bold text-sm">
                    {m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-warm-900 dark:text-warm-100 group-hover:text-accent transition-colors truncate">
                    {m.name}
                  </div>
                  <div className="text-sm text-warm-400 truncate">{m.email}</div>
                </div>
              </div>
              {m.city && (
                <div className="mt-3 text-sm text-warm-400">{m.city}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
