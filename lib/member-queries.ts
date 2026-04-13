import { supabase } from "./db";

export async function getMembers() {
  // Try persistent members table first, fall back to roster_members
  const { data: members, error } = await supabase
    .from("members")
    .select("*")
    .order("name");

  if (!error && members && members.length > 0) {
    return members;
  }

  // Fallback: aggregate unique members from roster_members
  const { data: roster } = await supabase
    .from("roster_members")
    .select("name, email")
    .order("name");

  if (!roster) return [];

  // Dedupe by email
  const seen = new Map<string, { id: string; name: string; email: string; city: string; created_at: string }>();
  for (const m of roster) {
    if (!seen.has(m.email)) {
      seen.set(m.email, {
        id: m.email, // use email as temp ID
        name: m.name,
        email: m.email,
        city: "",
        created_at: new Date().toISOString(),
      });
    }
  }
  return Array.from(seen.values());
}

export async function getMember(id: string) {
  // Try persistent members table
  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !member) return null;
  return member;
}

export async function getMemberByEmail(email: string) {
  // Try persistent members table first
  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("email", email)
    .single();

  if (member) return member;
  return null;
}

export async function getMemberHistory(memberEmail: string) {
  // Get all roster entries for this member across polls
  const { data: rosterEntries } = await supabase
    .from("roster_members")
    .select("id, poll_id, name, email")
    .eq("email", memberEmail);

  if (!rosterEntries || rosterEntries.length === 0) return { polls: [], responses: [], events: [], reviews: [], tickets: [] };

  const memberIds = rosterEntries.map((r) => r.id);
  const pollIds = [...new Set(rosterEntries.map((r) => r.poll_id))];

  // Get polls
  const { data: polls } = await supabase
    .from("polls")
    .select("id, title, phase, location, created_at")
    .in("id", pollIds)
    .order("created_at", { ascending: false });

  // Get responses
  const { data: responses } = await supabase
    .from("responses")
    .select("id, poll_id, member_id, flexibility, response_type")
    .in("member_id", memberIds);

  // Get response slots for voted responses
  const votedResponseIds = (responses ?? []).filter((r) => r.response_type === "voted").map((r) => r.id);
  const { data: responseSlots } = votedResponseIds.length > 0
    ? await supabase.from("response_slots").select("response_id, option_id, status, rank").in("response_id", votedResponseIds)
    : { data: [] };

  // Get offers (assigned seats)
  const responseIds = (responses ?? []).map((r) => r.id);
  const { data: offers } = responseIds.length > 0
    ? await supabase.from("offers").select("response_id, option_id").in("response_id", responseIds)
    : { data: [] };

  // Get options for context
  const { data: options } = await supabase
    .from("options")
    .select("id, poll_id, label, starts_at, capacity")
    .in("poll_id", pollIds);

  // Try to get events and reviews (may not exist yet)
  let events: Array<{ id: string; poll_id: string; title: string; location: string; event_date: string; menu: string }> = [];
  let reviews: Array<{ id: string; event_id: string; stars: number; body: string; created_at: string }> = [];
  let tickets: Array<{ id: string; event_id: string; quantity: number; amount_cents: number; purchased_at: string }> = [];

  try {
    // Try members table to get member ID
    const { data: persistentMember } = await supabase.from("members").select("id").eq("email", memberEmail).single();
    if (persistentMember) {
      const { data: evts } = await supabase.from("events").select("*").in("poll_id", pollIds).order("event_date", { ascending: false });
      events = evts ?? [];

      const { data: revs } = await supabase.from("reviews").select("*").eq("member_id", persistentMember.id);
      reviews = revs ?? [];

      const { data: tix } = await supabase.from("ticket_purchases").select("*").eq("member_id", persistentMember.id).order("purchased_at", { ascending: false });
      tickets = tix ?? [];
    }
  } catch {
    // Tables don't exist yet
  }

  // Build poll history
  const pollHistory = (polls ?? []).map((poll) => {
    const rosterEntry = rosterEntries.find((r) => r.poll_id === poll.id);
    const response = (responses ?? []).find((r) => r.member_id === rosterEntry?.id);
    const pollOptions = (options ?? []).filter((o) => o.poll_id === poll.id);
    const slotsVoted = response
      ? (responseSlots ?? []).filter((s) => s.response_id === response.id)
      : [];
    const assigned = response
      ? (offers ?? []).filter((o) => o.response_id === response.id)
      : [];
    const assignedOptions = assigned.map((a) => pollOptions.find((o) => o.id === a.option_id)).filter(Boolean);

    return {
      poll,
      response_type: response?.response_type ?? "no_response",
      flexibility: response?.flexibility ?? null,
      dates_available: slotsVoted.filter((s) => s.status === "available").length,
      dates_total: pollOptions.length,
      assigned_to: assignedOptions.map((o) => o!.label),
    };
  });

  return { polls: pollHistory, responses: responses ?? [], events, reviews, tickets };
}
