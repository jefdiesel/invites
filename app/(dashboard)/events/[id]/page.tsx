import { getEvent } from "@/lib/event-queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ReviewForm } from "@/app/components/review-form";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return notFound();

  const reviews = event.reviews as Array<{ id: string; stars: number; body: string; created_at: string; members?: { name: string; email: string } }>;
  const attendees = event.attendees as Array<{ name: string; email: string }>;

  const avgStars = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
    : null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Event header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-warm-900">{event.title}</h1>
        <div className="flex items-center gap-3 mt-2 text-sm text-warm-400">
          {event.location && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {event.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {new Date(event.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </span>
          <span>{new Date(event.event_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
        </div>
        {event.description && (
          <p className="text-sm text-warm-500 mt-3 max-w-xl leading-relaxed">{event.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-warm-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold tabular-nums text-warm-900">{attendees.length}</div>
          <div className="text-sm text-warm-400 mt-0.5">attended</div>
        </div>
        <div className="rounded-xl border border-warm-200 bg-white p-4 text-center">
          {avgStars !== null ? (
            <>
              <div className="text-2xl font-bold tabular-nums text-amber-500">{avgStars.toFixed(1)}</div>
              <div className="text-sm text-warm-400 mt-0.5">avg rating ({reviews.length})</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-warm-300">--</div>
              <div className="text-sm text-warm-400 mt-0.5">no reviews</div>
            </>
          )}
        </div>
        <div className="rounded-xl border border-warm-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold tabular-nums text-warm-900">{event.capacity ?? "--"}</div>
          <div className="text-sm text-warm-400 mt-0.5">capacity</div>
        </div>
      </div>

      {/* Menu */}
      {event.menu && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-warm-600 uppercase tracking-wider mb-3">Menu</h2>
          <div className="rounded-xl border border-warm-200 bg-white p-5">
            <p className="text-sm text-warm-700 whitespace-pre-wrap leading-relaxed">{event.menu}</p>
          </div>
        </div>
      )}

      {/* Attendees */}
      {attendees.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-warm-600 uppercase tracking-wider mb-3">Attendees ({attendees.length})</h2>
          <div className="rounded-xl border border-warm-200 bg-white divide-y divide-warm-100">
            {attendees.map((a, i) => (
              <Link key={i} href={`/members/${encodeURIComponent(a.email)}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-warm-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center shrink-0">
                  <span className="text-accent font-bold text-xs">
                    {a.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-warm-900">{a.name}</div>
                  <div className="text-sm text-warm-400">{a.email}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-warm-600 uppercase tracking-wider mb-3">
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-warm-400">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-warm-200 bg-white p-4">
                <div className="flex items-center gap-3 mb-2">
                  {review.members && (
                    <span className="text-sm font-semibold text-warm-900">{review.members.name}</span>
                  )}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`text-sm ${i < review.stars ? "text-amber-400" : "text-warm-200"}`}>&#9733;</span>
                    ))}
                  </div>
                  <span className="text-sm text-warm-400">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                {review.body && <p className="text-sm text-warm-600 leading-relaxed">{review.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write a review */}
      <ReviewForm eventId={id} />

      {/* Link to poll */}
      {event.poll_id && (
        <div className="mt-8 pt-6 border-t border-warm-200">
          <Link href={`/poll/${event.poll_id}`} className="text-sm font-medium text-accent hover:text-accent-light transition-colors">
            View original poll &rarr;
          </Link>
        </div>
      )}
    </main>
  );
}
