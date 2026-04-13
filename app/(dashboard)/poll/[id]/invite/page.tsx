import { getPoll } from "@/lib/queries";
import { notFound } from "next/navigation";
import { InviteUI } from "@/app/components/invite-ui";

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
    return { id: m.id, name: m.name, email: m.email, token: tok?.token ?? null, voted: !!tok?.used_at };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-warm-900">Send Invites</h1>
        <span className="text-sm text-warm-400">{p.title}</span>
      </div>
      <InviteUI
        pollId={id} pollTitle={p.title} pollDescription={p.description} pollLocation={p.location}
        pollDeadline={p.deadline} options={p.options} members={membersWithTokens}
        baseUrl={process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3002")}
      />
    </main>
  );
}
