import { supabase } from "@/lib/db";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const FIRST_NAMES = ["Emma","Liam","Olivia","Noah","Ava","Ethan","Sophia","Mason","Isabella","William","Mia","James","Charlotte","Benjamin","Amelia","Lucas","Harper","Henry","Evelyn","Alexander","Abigail","Michael","Emily","Daniel","Elizabeth","Jacob","Sofia","Logan","Avery","Jackson","Ella","Sebastian","Scarlett","Jack","Grace","Aiden","Chloe","Owen","Victoria","Samuel","Riley","Ryan","Aria","Nathan","Lily","Carter","Aurora","Luke","Zoey","Dylan"];
const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export async function POST() {
  const pollId = randomUUID();
  await supabase.from("polls").insert({
    id: pollId, title: "Summer Dinner Series",
    description: "Four evenings, two seatings each. Pick every time that works for you!",
    location: "The Lakehouse Restaurant", deadline: "2026-06-10T23:59", phase: "confirming",
  });

  // One week: Tue/Thu/Fri/Sat, early (6pm) and late (8:30pm) seatings
  const slots = [
    { label: "Tuesday Early",   starts_at: "2026-06-16T18:00", capacity: 24 },
    { label: "Tuesday Late",    starts_at: "2026-06-16T20:30", capacity: 24 },
    { label: "Thursday Early",  starts_at: "2026-06-18T18:00", capacity: 24 },
    { label: "Thursday Late",   starts_at: "2026-06-18T20:30", capacity: 24 },
    { label: "Friday Early",    starts_at: "2026-06-19T18:00", capacity: 30 },
    { label: "Friday Late",     starts_at: "2026-06-19T20:30", capacity: 30 },
    { label: "Saturday Early",  starts_at: "2026-06-20T18:00", capacity: 36 },
    { label: "Saturday Late",   starts_at: "2026-06-20T20:30", capacity: 36 },
  ];

  const optionIds: string[] = [];
  const optionRows = slots.map((s, i) => {
    const oid = randomUUID();
    optionIds.push(oid);
    return { id: oid, poll_id: pollId, label: s.label, starts_at: s.starts_at, capacity: s.capacity, sort_order: i };
  });
  await supabase.from("options").insert(optionRows);

  // Create 100 members
  const usedNames = new Set<string>();
  const members: { id: string; name: string }[] = [];
  const memberRows: { id: string; poll_id: string; name: string; email: string }[] = [];

  for (let i = 0; i < 100; i++) {
    let name: string;
    do { name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`; } while (usedNames.has(name));
    usedNames.add(name);
    const memberId = randomUUID();
    members.push({ id: memberId, name });
    memberRows.push({ id: memberId, poll_id: pollId, name, email: `${name.toLowerCase().replace(" ", ".")}@example.com` });
  }
  await supabase.from("roster_members").insert(memberRows);

  // Simulate votes with realistic patterns
  const tokenRows: { token: string; poll_id: string; member_id: string; used_at: string | null }[] = [];
  const responseRows: { id: string; poll_id: string; member_id: string; flexibility: string; response_type: string }[] = [];
  const slotRows: { response_id: string; option_id: string; status: string; rank: number | null }[] = [];

  for (const member of members) {
    const token = randomUUID();
    const rand = Math.random();

    if (rand < 0.08) {
      // ~8% don't vote
      tokenRows.push({ token, poll_id: pollId, member_id: member.id, used_at: null });
      continue;
    }

    tokenRows.push({ token, poll_id: pollId, member_id: member.id, used_at: new Date().toISOString() });

    if (rand < 0.13) {
      responseRows.push({ id: randomUUID(), poll_id: pollId, member_id: member.id, flexibility: "flexible", response_type: "not_interested" });
      continue;
    }

    if (rand < 0.19) {
      responseRows.push({ id: randomUUID(), poll_id: pollId, member_id: member.id, flexibility: pick(["flexible", "inflexible"]), response_type: "none_work" });
      continue;
    }

    // Normal vote — realistic patterns:
    // People tend to prefer weekends, and pick one seating per day (not both)
    const rid = randomUUID();
    const flex = Math.random() < 0.25 ? "inflexible" : "flexible";
    responseRows.push({ id: rid, poll_id: pollId, member_id: member.id, flexibility: flex, response_type: "voted" });

    const availableSlots: number[] = [];
    // For each day (pairs of early/late), decide availability
    for (let day = 0; day < 4; day++) {
      const earlyIdx = day * 2;
      const lateIdx = day * 2 + 1;
      const dayAvail = Math.random();

      if (dayAvail < 0.30) {
        // Can't make this day at all
        continue;
      } else if (dayAvail < 0.55) {
        // Can only do early
        availableSlots.push(earlyIdx);
      } else if (dayAvail < 0.80) {
        // Can only do late
        availableSlots.push(lateIdx);
      } else {
        // Can do either seating
        availableSlots.push(earlyIdx);
        availableSlots.push(lateIdx);
      }
    }

    // Ensure at least one slot
    if (availableSlots.length === 0) {
      availableSlots.push(Math.floor(Math.random() * optionIds.length));
    }

    // Rank available slots (weekend preference boost)
    const ranked = shuffle(availableSlots);

    for (let s = 0; s < optionIds.length; s++) {
      const isAvail = availableSlots.includes(s);
      const rankIdx = ranked.indexOf(s);
      const rank = isAvail && Math.random() < 0.75 ? rankIdx + 1 : null;
      slotRows.push({ response_id: rid, option_id: optionIds[s], status: isAvail ? "available" : "unable", rank });
    }
  }

  await supabase.from("poll_tokens").insert(tokenRows);
  await supabase.from("responses").insert(responseRows);
  for (let i = 0; i < slotRows.length; i += 500) {
    await supabase.from("response_slots").insert(slotRows.slice(i, i + 500));
  }

  return NextResponse.json({ pollId, members: members.length, slots: slots.length });
}
