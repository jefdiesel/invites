import { supabase } from "./db";

export async function getPolls() {
  const { data: polls } = await supabase
    .from("polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (!polls) return [];

  // Get counts for each poll
  return Promise.all(polls.map(async (p) => {
    const { count: response_count } = await supabase
      .from("responses")
      .select("*", { count: "exact", head: true })
      .eq("poll_id", p.id);
    const { count: member_count } = await supabase
      .from("roster_members")
      .select("*", { count: "exact", head: true })
      .eq("poll_id", p.id);
    return { ...p, response_count: response_count ?? 0, member_count: member_count ?? 0 };
  }));
}

export async function getPoll(id: string) {
  const { data: poll } = await supabase.from("polls").select("*").eq("id", id).single();
  if (!poll) return null;

  const { data: options } = await supabase.from("options").select("*").eq("poll_id", id).order("sort_order");
  const { data: members } = await supabase.from("roster_members").select("*").eq("poll_id", id);
  const { data: tokens } = await supabase.from("poll_tokens").select("*").eq("poll_id", id);
  const { data: responses } = await supabase.from("responses").select("*").eq("poll_id", id);

  return { ...poll, options: options ?? [], members: members ?? [], tokens: tokens ?? [], responses: responses ?? [] };
}

export async function getPollResults(pollId: string) {
  const { data: poll } = await supabase.from("polls").select("*").eq("id", pollId).single();
  if (!poll) return null;

  const { data: options } = await supabase.from("options").select("*").eq("poll_id", pollId).order("sort_order");
  if (!options) return null;

  // Fetch all responses and slots in bulk (avoid N+1)
  const { data: allResponses } = await supabase.from("responses").select("*").eq("poll_id", pollId);
  const { data: allSlots } = await supabase
    .from("response_slots")
    .select("*, responses!inner(poll_id, response_type)")
    .eq("responses.poll_id", pollId);
  const { data: allOffers } = await supabase
    .from("offers")
    .select("*, responses!inner(poll_id, member_id)")
    .eq("responses.poll_id", pollId);

  const responses = allResponses ?? [];
  const slots = allSlots ?? [];
  const offers = allOffers ?? [];

  const votedResponses = responses.filter((r) => r.response_type === "voted");
  const totalResponses = responses.length;
  const votedCount = votedResponses.length;
  const notInterestedCount = responses.filter((r) => r.response_type === "not_interested").length;
  const noneWorkCount = responses.filter((r) => r.response_type === "none_work").length;
  const inflexibleCount = votedResponses.filter((r) => r.flexibility === "inflexible").length;
  const flexibleCount = votedCount - inflexibleCount;

  // Build slot stats
  const votedSlots = slots.filter((s) => s.responses?.response_type === "voted");

  const slotStats = options.map((opt) => {
    const optSlots = votedSlots.filter((s) => s.option_id === opt.id);
    const available = optSlots.filter((s) => s.status === "available").length;
    const unable = optSlots.filter((s) => s.status === "unable").length;

    // Criticality: voters for whom this is their only available slot
    const availableResponseIds = new Set(optSlots.filter((s) => s.status === "available").map((s) => s.response_id));
    let onlyOption = 0;
    for (const rid of availableResponseIds) {
      const allAvailForVoter = votedSlots.filter((s) => s.response_id === rid && s.status === "available");
      if (allAvailForVoter.length === 1) onlyOption++;
    }

    // Borda score
    let bordaScore = 0;
    for (const s of optSlots.filter((s) => s.status === "available")) {
      const nAvail = votedSlots.filter((vs) => vs.response_id === s.response_id && vs.status === "available").length;
      if (s.rank != null) {
        bordaScore += Math.max(0, nAvail - s.rank + 1);
      } else {
        bordaScore += 0.5;
      }
    }

    // Inflexible breakdown
    const inflexResponseIds = new Set(votedResponses.filter((r) => r.flexibility === "inflexible").map((r) => r.id));
    const inflexAvailable = optSlots.filter((s) => s.status === "available" && inflexResponseIds.has(s.response_id)).length;
    const inflexUnable = optSlots.filter((s) => s.status === "unable" && inflexResponseIds.has(s.response_id)).length;

    const assignedCount = offers.filter((o) => o.option_id === opt.id).length;

    return {
      ...opt,
      available,
      unable,
      onlyOption,
      bordaScore: Math.round(bordaScore * 10) / 10,
      inflexAvailable,
      inflexUnable,
      assignedCount,
    };
  });

  // Members with response info
  const { data: members } = await supabase
    .from("roster_members")
    .select("id, name, email")
    .eq("poll_id", pollId)
    .order("name");

  const { data: tokens } = await supabase.from("poll_tokens").select("member_id, used_at").eq("poll_id", pollId);

  const tokenMap = new Map((tokens ?? []).map((t) => [t.member_id, t.used_at]));
  const responseMap = new Map(responses.map((r) => [r.member_id, r]));

  const membersWithInfo = (members ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    used_at: tokenMap.get(m.id) ?? null,
    response_id: responseMap.get(m.id)?.id ?? null,
    flexibility: responseMap.get(m.id)?.flexibility ?? null,
    response_type: responseMap.get(m.id)?.response_type ?? null,
  }));

  const memberSlots = votedSlots.map((s) => ({
    response_id: s.response_id,
    option_id: s.option_id,
    status: s.status,
    rank: s.rank,
  }));

  // Offers with member info
  const memberIdMap = new Map(responses.map((r) => [r.id, r.member_id]));
  const memberNameMap = new Map((members ?? []).map((m) => [m.id, { name: m.name, email: m.email }]));

  const offersWithNames = offers.map((o) => {
    const memberId = memberIdMap.get(o.response_id);
    const member = memberId ? memberNameMap.get(memberId) : null;
    return {
      response_id: o.response_id,
      option_id: o.option_id,
      name: member?.name ?? "",
      email: member?.email ?? "",
    };
  });

  return {
    poll,
    options: slotStats,
    totalResponses,
    votedCount,
    notInterestedCount,
    noneWorkCount,
    flexibleCount,
    inflexibleCount,
    members: membersWithInfo,
    memberSlots,
    offers: offersWithNames,
    hasOffers: offers.length > 0,
  };
}

export async function getSlotAttendees(pollId: string, optionId: string) {
  const { data: option } = await supabase.from("options").select("*").eq("id", optionId).eq("poll_id", pollId).single();
  if (!option) return null;

  const { data: poll } = await supabase.from("polls").select("id, title, phase").eq("id", pollId).single();

  // Get all offers for this slot
  const { data: offerRows } = await supabase
    .from("offers")
    .select("response_id, option_id")
    .eq("option_id", optionId);

  const offerResponseIds = new Set((offerRows ?? []).map((o) => o.response_id));

  // Get all responses that marked this slot available
  const { data: availSlots } = await supabase
    .from("response_slots")
    .select("response_id, option_id, status, rank")
    .eq("option_id", optionId)
    .eq("status", "available");

  const availResponseIds = (availSlots ?? []).map((s) => s.response_id);
  const slotRankMap = new Map((availSlots ?? []).map((s) => [s.response_id, s.rank]));

  // Get response details
  const { data: responseRows } = await supabase
    .from("responses")
    .select("id, member_id, flexibility, response_type")
    .eq("poll_id", pollId)
    .eq("response_type", "voted")
    .in("id", availResponseIds.length > 0 ? availResponseIds : ["__none__"]);

  const responseMap = new Map((responseRows ?? []).map((r) => [r.id, r]));
  const memberIds = [...new Set((responseRows ?? []).map((r) => r.member_id))];

  const { data: memberRows } = await supabase
    .from("roster_members")
    .select("id, name, email")
    .in("id", memberIds.length > 0 ? memberIds : ["__none__"]);

  const memberMap = new Map((memberRows ?? []).map((m) => [m.id, m]));

  function buildList(responseIds: string[]) {
    return responseIds
      .map((rid) => {
        const resp = responseMap.get(rid);
        if (!resp) return null;
        const member = memberMap.get(resp.member_id);
        if (!member) return null;
        return {
          name: member.name,
          email: member.email,
          flexibility: resp.flexibility,
          rank: slotRankMap.get(rid) ?? null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a!.rank ?? 999) - (b!.rank ?? 999) || a!.name.localeCompare(b!.name)) as { name: string; email: string; flexibility: string; rank: number | null }[];
  }

  const assignedIds = availResponseIds.filter((rid) => offerResponseIds.has(rid));
  const waitlistIds = availResponseIds.filter((rid) => !offerResponseIds.has(rid));

  return {
    poll,
    option,
    assigned: buildList(assignedIds),
    waitlist: buildList(waitlistIds),
    allAvailable: buildList(availResponseIds),
  };
}

export async function getVoteData(token: string) {
  const { data: tokenRow } = await supabase.from("poll_tokens").select("*").eq("token", token).single();
  if (!tokenRow) return null;

  const { data: poll } = await supabase.from("polls").select("*").eq("id", tokenRow.poll_id).single();
  const { data: options } = await supabase.from("options").select("*").eq("poll_id", tokenRow.poll_id).order("sort_order");
  const { data: member } = await supabase.from("roster_members").select("*").eq("id", tokenRow.member_id).single();

  return {
    token: tokenRow.token,
    used: !!tokenRow.used_at,
    poll,
    options: options ?? [],
    member,
  };
}
