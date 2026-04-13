import { getMembers } from "@/lib/member-queries";
import { MemberTable } from "@/app/components/member-table";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-warm-900 mb-6">Members</h1>
      <MemberTable members={members} />
    </main>
  );
}
