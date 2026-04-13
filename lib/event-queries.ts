import { supabase } from "./db";

export async function getEvents() {
  // Try events table first
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  if (!error && events) {
    // Get review stats for each event
    return Promise.all(events.map(async (event) => {
      const { data: reviews } = await supabase
        .from("reviews")
        .select("stars")
        .eq("event_id", event.id);

      const avgStars = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
        : null;

      const { count: ticketCount } = await supabase
        .from("ticket_purchases")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);

      return { ...event, avg_stars: avgStars, review_count: reviews?.length ?? 0, ticket_count: ticketCount ?? 0 };
    }));
  }

  // Fallback: create event-like data from completed polls
  const { data: polls } = await supabase
    .from("polls")
    .select("id, title, location, description, phase, created_at")
    .eq("phase", "notified")
    .order("created_at", { ascending: false });

  if (!polls) return [];

  return Promise.all(polls.map(async (poll) => {
    const { data: confirmedSlots } = await supabase
      .from("options")
      .select("label, starts_at, capacity")
      .eq("poll_id", poll.id)
      .eq("confirmed", 1)
      .order("sort_order")
      .limit(1);

    return {
      id: poll.id,
      poll_id: poll.id,
      title: poll.title,
      location: poll.location,
      description: poll.description,
      menu: "",
      event_date: confirmedSlots?.[0]?.starts_at ?? poll.created_at,
      capacity: confirmedSlots?.[0]?.capacity ?? null,
      created_at: poll.created_at,
      avg_stars: null,
      review_count: 0,
      ticket_count: 0,
    };
  }));
}

export async function getEvent(id: string) {
  // Try events table
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!error && event) {
    // Get reviews
    const { data: reviews } = await supabase
      .from("reviews")
      .select("*, members(name, email)")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    // Get tickets
    const { data: tickets } = await supabase
      .from("ticket_purchases")
      .select("*, members(name, email)")
      .eq("event_id", id)
      .order("purchased_at", { ascending: false });

    // Get attendees from poll if linked
    let attendees: { name: string; email: string }[] = [];
    if (event.poll_id) {
      const { data: offers } = await supabase
        .from("offers")
        .select("response_id")
        .in("option_id", await supabase.from("options").select("id").eq("poll_id", event.poll_id).eq("confirmed", 1).then(r => (r.data ?? []).map(o => o.id)));

      if (offers) {
        const responseIds = offers.map(o => o.response_id);
        const { data: responses } = await supabase
          .from("responses")
          .select("member_id")
          .in("id", responseIds.length > 0 ? responseIds : ["__none__"]);

        if (responses) {
          const memberIds = responses.map(r => r.member_id);
          const { data: members } = await supabase
            .from("roster_members")
            .select("name, email")
            .in("id", memberIds.length > 0 ? memberIds : ["__none__"]);
          attendees = members ?? [];
        }
      }
    }

    return {
      ...event,
      reviews: reviews ?? [],
      tickets: tickets ?? [],
      attendees,
    };
  }

  // Fallback: try as a poll ID
  const { data: poll } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (!poll) return null;

  // Get confirmed slots and attendees
  const { data: confirmedSlots } = await supabase
    .from("options")
    .select("id, label, starts_at, capacity")
    .eq("poll_id", id)
    .eq("confirmed", 1)
    .order("sort_order");

  const slotIds = (confirmedSlots ?? []).map(s => s.id);
  const { data: offers } = slotIds.length > 0
    ? await supabase.from("offers").select("response_id").in("option_id", slotIds)
    : { data: [] };

  const responseIds = (offers ?? []).map(o => o.response_id);
  const { data: responses } = responseIds.length > 0
    ? await supabase.from("responses").select("member_id").in("id", responseIds)
    : { data: [] };

  const memberIds = (responses ?? []).map(r => r.member_id);
  const { data: members } = memberIds.length > 0
    ? await supabase.from("roster_members").select("name, email").in("id", memberIds)
    : { data: [] };

  return {
    id: poll.id,
    poll_id: poll.id,
    title: poll.title,
    location: poll.location,
    description: poll.description,
    menu: "",
    event_date: confirmedSlots?.[0]?.starts_at ?? poll.created_at,
    capacity: confirmedSlots?.[0]?.capacity ?? null,
    slots: confirmedSlots ?? [],
    reviews: [],
    tickets: [],
    attendees: members ?? [],
  };
}
