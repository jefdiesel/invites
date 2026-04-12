"use server";

import { supabase } from "./db";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export async function createPoll(formData: FormData) {
  const id = randomUUID();
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const location = (formData.get("location") as string) || "";
  const deadline = (formData.get("deadline") as string) || null;

  await supabase.from("polls").insert({ id, title, description, location, deadline });

  const slotsJson = formData.get("slots") as string;
  if (slotsJson) {
    const slots: { label: string; starts_at: string; capacity: number | null }[] = JSON.parse(slotsJson);
    const rows = slots.map((s, i) => ({
      id: randomUUID(), poll_id: id, label: s.label, starts_at: s.starts_at, capacity: s.capacity, sort_order: i,
    }));
    await supabase.from("options").insert(rows);
  }

  revalidatePath("/");
  return { id };
}

export async function addSlotToPoll(pollId: string, label: string, startsAt: string) {
  const { data } = await supabase.from("options").select("sort_order").eq("poll_id", pollId).order("sort_order", { ascending: false }).limit(1);
  const maxOrder = data?.[0]?.sort_order ?? -1;
  await supabase.from("options").insert({ id: randomUUID(), poll_id: pollId, label, starts_at: startsAt, sort_order: maxOrder + 1 });
  revalidatePath(`/poll/${pollId}`);
}

export async function addMembers(pollId: string, members: { name: string; email: string }[]) {
  for (const m of members) {
    const memberId = randomUUID();
    const token = randomUUID();
    await supabase.from("roster_members").insert({ id: memberId, poll_id: pollId, name: m.name, email: m.email });
    await supabase.from("poll_tokens").insert({ token, poll_id: pollId, member_id: memberId });
  }
  revalidatePath(`/poll/${pollId}`);
}

export async function submitVote(
  token: string,
  flexibility: "flexible" | "inflexible",
  slots: { optionId: string; status: "available" | "unable"; rank: number | null }[],
  responseType: "voted" | "not_interested" | "none_work" = "voted"
) {
  const { data: tokenRow } = await supabase.from("poll_tokens").select("*").eq("token", token).single();
  if (!tokenRow) throw new Error("Invalid voting link");
  if (tokenRow.used_at) throw new Error("You have already voted");

  const { data: poll } = await supabase.from("polls").select("phase").eq("id", tokenRow.poll_id).single();
  if (poll?.phase !== "polling") throw new Error("This poll is no longer accepting votes");

  const responseId = randomUUID();

  await supabase.from("responses").insert({
    id: responseId, poll_id: tokenRow.poll_id, member_id: tokenRow.member_id, flexibility, response_type: responseType,
  });

  if (responseType === "voted") {
    const rows = slots.map((s) => ({
      response_id: responseId, option_id: s.optionId, status: s.status, rank: s.rank,
    }));
    await supabase.from("response_slots").insert(rows);
  }

  await supabase.from("poll_tokens").update({ used_at: new Date().toISOString() }).eq("token", token);

  revalidatePath(`/poll/${tokenRow.poll_id}`);
}

export async function updatePoll(
  pollId: string,
  fields: { title: string; description: string; location: string; deadline: string | null }
) {
  await supabase.from("polls").update(fields).eq("id", pollId);
  revalidatePath(`/poll/${pollId}`);
  revalidatePath(`/poll/${pollId}/edit`);
  revalidatePath("/");
}

export async function updateSlot(
  optionId: string,
  fields: { label: string; starts_at: string; capacity: number | null }
) {
  await supabase.from("options").update(fields).eq("id", optionId);
}

export async function deleteSlot(optionId: string, pollId: string) {
  await supabase.from("options").delete().eq("id", optionId);
  revalidatePath(`/poll/${pollId}/edit`);
}

export async function deletePoll(pollId: string) {
  // Delete in order due to foreign keys
  const { data: respIds } = await supabase.from("responses").select("id").eq("poll_id", pollId);
  if (respIds && respIds.length > 0) {
    const ids = respIds.map((r) => r.id);
    await supabase.from("offers").delete().in("response_id", ids);
    await supabase.from("response_slots").delete().in("response_id", ids);
  }
  await supabase.from("responses").delete().eq("poll_id", pollId);
  await supabase.from("poll_tokens").delete().eq("poll_id", pollId);
  await supabase.from("roster_members").delete().eq("poll_id", pollId);
  await supabase.from("options").delete().eq("poll_id", pollId);
  await supabase.from("polls").delete().eq("id", pollId);
  revalidatePath("/");
}

export async function updatePhase(pollId: string, phase: "polling" | "confirming" | "notified") {
  await supabase.from("polls").update({ phase }).eq("id", pollId);
  revalidatePath(`/poll/${pollId}`);
}

export async function toggleConfirmed(optionId: string) {
  const { data } = await supabase.from("options").select("confirmed").eq("id", optionId).single();
  await supabase.from("options").update({ confirmed: data?.confirmed ? 0 : 1 }).eq("id", optionId);
}

export async function updateCapacity(optionId: string, capacity: number | null) {
  await supabase.from("options").update({ capacity }).eq("id", optionId);
}

export async function assignMembers(pollId: string) {
  // Clear previous offers
  const { data: respIds } = await supabase.from("responses").select("id").eq("poll_id", pollId);
  if (respIds && respIds.length > 0) {
    await supabase.from("offers").delete().in("response_id", respIds.map((r) => r.id));
  }

  // Get confirmed options
  const { data: confirmedOptions } = await supabase
    .from("options")
    .select("id, capacity")
    .eq("poll_id", pollId)
    .eq("confirmed", 1)
    .order("sort_order");

  if (!confirmedOptions) return;

  const capacityLeft = new Map<string, number>();
  for (const opt of confirmedOptions) {
    capacityLeft.set(opt.id, opt.capacity ?? Infinity);
  }

  const confirmedIds = new Set(confirmedOptions.map((o) => o.id));

  // Get all voted responses with their slots
  const { data: responses } = await supabase
    .from("responses")
    .select("id, member_id, flexibility")
    .eq("poll_id", pollId)
    .eq("response_type", "voted");

  const { data: allSlots } = await supabase
    .from("response_slots")
    .select("response_id, option_id, status, rank")
    .in("response_id", (responses ?? []).map((r) => r.id));

  // Sort responses by constraint (fewest available confirmed slots)
  const respWithCount = (responses ?? []).map((r) => {
    const availConfirmed = (allSlots ?? []).filter(
      (s) => s.response_id === r.id && s.status === "available" && confirmedIds.has(s.option_id)
    ).length;
    return { ...r, availConfirmed };
  }).sort((a, b) => {
    if (a.availConfirmed !== b.availConfirmed) return a.availConfirmed - b.availConfirmed;
    if (a.flexibility === "inflexible" && b.flexibility !== "inflexible") return -1;
    if (b.flexibility === "inflexible" && a.flexibility !== "inflexible") return 1;
    return 0;
  });

  const offersToInsert: { response_id: string; option_id: string }[] = [];

  for (const resp of respWithCount) {
    const availSlots = (allSlots ?? [])
      .filter((s) => s.response_id === resp.id && s.status === "available" && confirmedIds.has(s.option_id))
      .sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999));

    for (const slot of availSlots) {
      const remaining = capacityLeft.get(slot.option_id) ?? 0;
      if (remaining > 0) {
        offersToInsert.push({ response_id: resp.id, option_id: slot.option_id });
        capacityLeft.set(slot.option_id, remaining - 1);
      }
    }
  }

  if (offersToInsert.length > 0) {
    await supabase.from("offers").insert(offersToInsert);
  }

  revalidatePath(`/poll/${pollId}`);
}

export async function sendNotifications(pollId: string) {
  await supabase.from("polls").update({ phase: "notified" }).eq("id", pollId);
  revalidatePath(`/poll/${pollId}`);
}
