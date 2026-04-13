import { supabase } from "./db";

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  city: string;
  joined: string;
  polls_sent: number;
  polls_voted: number;
  events_attended: number;
};

export async function getMembers(): Promise<MemberRow[]> {
  // Get all roster members across all polls
  const { data: roster } = await supabase
    .from("roster_members")
    .select("id, poll_id, name, email")
    .order("name");

  if (!roster || roster.length === 0) return [];

  // Get all responses
  const { data: responses } = await supabase
    .from("responses")
    .select("member_id, response_type");

  // Get all offers (assigned = attended)
  const { data: offers } = await supabase
    .from("offers")
    .select("response_id");

  const { data: allResponses } = await supabase
    .from("responses")
    .select("id, member_id");

  const offerResponseIds = new Set((offers ?? []).map((o) => o.response_id));
  const responseToMember = new Map((allResponses ?? []).map((r) => [r.id, r.member_id]));

  // Get poll created_at for join date
  const { data: polls } = await supabase
    .from("polls")
    .select("id, created_at")
    .order("created_at", { ascending: true });

  const pollDates = new Map((polls ?? []).map((p) => [p.id, p.created_at]));

  // Aggregate by email
  const memberMap = new Map<string, {
    name: string;
    email: string;
    city: string;
    joined: string;
    pollIds: Set<string>;
    rosterIds: Set<string>;
    voted: number;
  }>();

  for (const r of roster) {
    const existing = memberMap.get(r.email);
    const pollDate = pollDates.get(r.poll_id) ?? new Date().toISOString();
    if (existing) {
      existing.pollIds.add(r.poll_id);
      existing.rosterIds.add(r.id);
      if (pollDate < existing.joined) existing.joined = pollDate;
    } else {
      memberMap.set(r.email, {
        name: r.name,
        email: r.email,
        city: "",
        joined: pollDate,
        pollIds: new Set([r.poll_id]),
        rosterIds: new Set([r.id]),
        voted: 0,
      });
    }
  }

  // Count votes per member
  const responseMap = new Map<string, string[]>();
  for (const r of (responses ?? [])) {
    const list = responseMap.get(r.member_id) ?? [];
    list.push(r.response_type);
    responseMap.set(r.member_id, list);
  }

  const result: MemberRow[] = [];
  for (const [email, m] of memberMap) {
    let voted = 0;
    let attended = 0;
    for (const rid of m.rosterIds) {
      const types = responseMap.get(rid) ?? [];
      if (types.some((t) => t === "voted" || t === "not_interested" || t === "none_work")) voted++;

      // Check if any of their responses resulted in an offer
      for (const [respId, memberId] of responseToMember) {
        if (memberId === rid && offerResponseIds.has(respId)) {
          attended++;
          break;
        }
      }
    }

    result.push({
      id: email,
      name: m.name,
      email: m.email,
      city: m.city,
      joined: m.joined,
      polls_sent: m.pollIds.size,
      polls_voted: voted,
      events_attended: attended,
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getMemberHistory(memberEmail: string) {
  const { data: rosterEntries } = await supabase
    .from("roster_members")
    .select("id, poll_id, name, email")
    .eq("email", memberEmail);

  if (!rosterEntries || rosterEntries.length === 0) return { polls: [], responses: [], events: [], reviews: [], tickets: [] };

  const memberIds = rosterEntries.map((r) => r.id);
  const pollIds = [...new Set(rosterEntries.map((r) => r.poll_id))];

  const { data: polls } = await supabase
    .from("polls")
    .select("id, title, phase, location, created_at")
    .in("id", pollIds)
    .order("created_at", { ascending: false });

  const { data: responses } = await supabase
    .from("responses")
    .select("id, poll_id, member_id, flexibility, response_type")
    .in("member_id", memberIds);

  const votedResponseIds = (responses ?? []).filter((r) => r.response_type === "voted").map((r) => r.id);
  const { data: responseSlots } = votedResponseIds.length > 0
    ? await supabase.from("response_slots").select("response_id, option_id, status, rank").in("response_id", votedResponseIds)
    : { data: [] };

  const responseIds = (responses ?? []).map((r) => r.id);
  const { data: offers } = responseIds.length > 0
    ? await supabase.from("offers").select("response_id, option_id").in("response_id", responseIds)
    : { data: [] };

  const { data: options } = await supabase
    .from("options")
    .select("id, poll_id, label, starts_at, capacity")
    .in("poll_id", pollIds);

  let events: Array<{ id: string; poll_id: string; title: string; location: string; event_date: string; menu: string }> = [];
  let reviews: Array<{ id: string; event_id: string; stars: number; body: string; created_at: string }> = [];
  let tickets: Array<{ id: string; event_id: string; quantity: number; amount_cents: number; purchased_at: string }> = [];

  try {
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

  const pollHistory = (polls ?? []).map((poll) => {
    const rosterEntry = rosterEntries.find((r) => r.poll_id === poll.id);
    const response = (responses ?? []).find((r) => r.member_id === rosterEntry?.id);
    const pollOptions = (options ?? []).filter((o) => o.poll_id === poll.id);
    const slotsVoted = response ? (responseSlots ?? []).filter((s) => s.response_id === response.id) : [];
    const assigned = response ? (offers ?? []).filter((o) => o.response_id === response.id) : [];
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
