import { getEvents } from "@/lib/event-queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">Events</h1>
        <span className="text-sm text-warm-400">{events.length} total</span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-10 text-center">
          <p className="text-base text-warm-500">No events yet. Confirm and close a poll to create your first event.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="flex items-center gap-5 rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-5 hover:border-warm-300 dark:hover:border-warm-700 hover:shadow-sm transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-accent-muted flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-bold text-accent uppercase">
                  {new Date(event.event_date).toLocaleDateString("en-US", { month: "short" })}
                </span>
                <span className="text-lg font-bold text-accent leading-none">
                  {new Date(event.event_date).getDate()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-warm-900 dark:text-warm-100 group-hover:text-accent transition-colors">
                  {event.title}
                </div>
                <div className="text-sm text-warm-400 mt-0.5">
                  {event.location && `${event.location} · `}
                  {new Date(event.event_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  {event.capacity && ` · ${event.capacity} seats`}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {event.avg_stars !== null && (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`text-sm ${i < Math.round(event.avg_stars!) ? "text-amber-400" : "text-warm-200 dark:text-warm-700"}`}>&#9733;</span>
                      ))}
                    </div>
                    <span className="text-sm text-warm-400 ml-1">({event.review_count})</span>
                  </div>
                )}
                {event.ticket_count > 0 && (
                  <span className="text-sm text-warm-400">{event.ticket_count} tickets</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
