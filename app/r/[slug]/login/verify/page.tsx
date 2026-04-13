import { verifyMagicLink } from "@/lib/restaurant-actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  if (!token) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-500">Invalid link.</div>;
  }

  const result = await verifyMagicLink(token);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Link expired</h1>
          <p className="text-neutral-500">This login link has expired or was already used. Please request a new one.</p>
        </div>
      </div>
    );
  }

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(`session_${result.slug}`, JSON.stringify({ role: result.role, slug: result.slug }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/r/${result.slug}`,
    maxAge: 60 * 60 * 12,
  });

  redirect(result.role === "admin" ? `/r/${result.slug}/admin` : `/r/${result.slug}/manage`);
}
