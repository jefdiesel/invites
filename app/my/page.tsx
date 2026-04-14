import { getGuestSession } from "@/lib/guest-auth";
import { getGuestBookings } from "@/lib/guest-actions";
import { GuestDashboard } from "./guest-dashboard";
import { GuestLogin } from "./guest-login";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const session = await getGuestSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="border-b border-neutral-100">
          <div className="max-w-lg mx-auto px-6 h-14 flex items-center">
            <Link href="/" className="font-[family-name:var(--font-display)] text-xl text-neutral-900">Remi</Link>
          </div>
        </nav>
        <main className="max-w-lg mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Your Reservations</h1>
          <p className="text-base text-neutral-500 mb-8">
            Enter your email to view and manage reservations across all Remi restaurants.
          </p>
          <GuestLogin />
        </main>
      </div>
    );
  }

  const { upcoming, past, guest } = await getGuestBookings(session.email);

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-100">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-display)] text-xl text-neutral-900">Remi</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">{session.email}</span>
          </div>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <GuestDashboard upcoming={upcoming} past={past} guest={guest} />
      </main>
    </div>
  );
}
