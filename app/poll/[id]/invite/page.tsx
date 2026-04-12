import { getPoll } from "@/lib/queries";
import { notFound } from "next/navigation";
import { InviteUI } from "@/app/components/invite-ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) return notFound();

  const p = poll as unknown as {
    id: string; title: string; description: string; location: string; deadline: string | null; phase: string;
    options: { id: string; label: string; starts_at: string; capacity: number | null }[];
    tokens: { token: string; member_id: string; used_at: string | null }[];
    members: { id: string; name: string; email: string }[];
  };

  const membersWithTokens = p.members.map((m) => {
    const tok = p.tokens.find((t) => t.member_id === m.id);
    return {
      id: m.id,
      name: m.name,
      email: m.email,
      token: tok?.token ?? null,
      voted: !!tok?.used_at,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur-sm bg-stone-50/80 dark:bg-stone-950/80 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center gap-3">
          <Link href={`/poll/${id}`} className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors px-1">
            &larr;
          </Link>
          <h1 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Send Invites</h1>
          <span className="text-xs text-stone-400">{p.title}</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <InviteUI
          pollId={id}
          pollTitle={p.title}
          pollDescription={p.description}
          pollLocation={p.location}
          pollDeadline={p.deadline}
          options={p.options}
          members={membersWithTokens}
          baseUrl={process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3002")}
        />
      </main>
    </div>
  );
}
