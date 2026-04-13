import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-warm-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/polls" className="text-base font-bold tracking-tight text-warm-900">
            Remi
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/polls" className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-50 transition-colors">
              Polls
            </Link>
            <Link href="/members" className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-50 transition-colors">
              Members
            </Link>
            <Link href="/events" className="rounded-lg px-3 py-1.5 text-sm font-medium text-warm-600 hover:text-warm-900 hover:bg-warm-50 transition-colors">
              Events
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </>
  );
}
