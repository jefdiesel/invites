import { getEvents } from "@/lib/event-queries";
import { EventTable } from "@/app/components/event-table";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-warm-900 mb-6">Events</h1>
      <EventTable events={events} />
    </main>
  );
}
