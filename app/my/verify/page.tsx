import { verifyGuestToken, setGuestSession } from "@/lib/guest-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Invalid link</h1>
          <p className="text-neutral-500 mb-4">This login link is missing or malformed.</p>
          <a href="/my" className="text-sm font-medium text-neutral-900 underline">Try again</a>
        </div>
      </div>
    );
  }

  const email = await verifyGuestToken(token);

  if (!email) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Link expired</h1>
          <p className="text-neutral-500 mb-4">This login link has expired or was already used.</p>
          <a href="/my" className="text-sm font-medium text-neutral-900 underline">Request a new one</a>
        </div>
      </div>
    );
  }

  await setGuestSession(email);
  redirect("/my");
}
