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
    id: pollId, title: "June Supper Club",
    description: "Two nights, two seatings. Most people can only make one — pick the time that works best for you.",
    location: "Chez Laurent, 412 Oak St", deadline: "2026-06-01T23:59", phase: "confirming",
  });

  // 2 days × 2 seatings, 60 seats total (15 per seating)
  const slots = [
    { label: "Friday 6pm",    starts_at: "2026-06-19T18:00", capacity: 15 },
    { label: "Friday 8:30pm", starts_at: "2026-06-19T20:30", capacity: 15 },
    { label: "Saturday 6pm",    starts_at: "2026-06-20T18:00", capacity: 15 },
    { label: "Saturday 8:30pm", starts_at: "2026-06-20T20:30", capacity: 15 },
  ];

  const optionIds: string[] = [];
  const optionRows = slots.map((s, i) => {
    const oid = randomUUID();
    optionIds.push(oid);
    return { id: oid, poll_id: pollId, label: s.label, starts_at: s.starts_at, capacity: s.capacity, sort_order: i };
  });
  await supabase.from("options").insert(optionRows);

  // 100 members
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

  // Realistic voting: people pick ONE slot, maybe two. Nobody wants to go twice.
  const tokenRows: { token: string; poll_id: string; member_id: string; used_at: string | null }[] = [];
  const responseRows: { id: string; poll_id: string; member_id: string; flexibility: string; response_type: string }[] = [];
  const slotRows: { response_id: string; option_id: string; status: string; rank: number | null }[] = [];

  for (const member of members) {
    const token = randomUUID();
    const rand = Math.random();

    // ~12% don't vote
    if (rand < 0.12) {
      tokenRows.push({ token, poll_id: pollId, member_id: member.id, used_at: null });
      continue;
    }

    tokenRows.push({ token, poll_id: pollId, member_id: member.id, used_at: new Date().toISOString() });

    // ~6% not interested
    if (rand < 0.18) {
      responseRows.push({ id: randomUUID(), poll_id: pollId, member_id: member.id, flexibility: "flexible", response_type: "not_interested" });
      continue;
    }

    // ~5% none work
    if (rand < 0.23) {
      responseRows.push({ id: randomUUID(), poll_id: pollId, member_id: member.id, flexibility: pick(["flexible", "inflexible"]), response_type: "none_work" });
      continue;
    }

    // Normal vote
    const rid = randomUUID();
    const flex = Math.random() < 0.35 ? "inflexible" : "flexible";
    responseRows.push({ id: rid, poll_id: pollId, member_id: member.id, flexibility: flex, response_type: "voted" });

    // Realistic: each person picks 1-2 slots max (they only want to go once)
    // Some people can only do one day, some prefer one time
    const pattern = Math.random();
    let availableIdxs: number[];

    if (pattern < 0.30) {
      // Can only do Friday — pick one seating
      availableIdxs = [Math.random() < 0.55 ? 0 : 1];
    } else if (pattern < 0.55) {
      // Can only do Saturday — pick one seating
      availableIdxs = [Math.random() < 0.55 ? 2 : 3];
    } else if (pattern < 0.70) {
      // Can do one from each day (flexible on day, locked on time)
      const time = Math.random() < 0.5 ? 0 : 1; // early or late
      availableIdxs = [time, time + 2];
    } else if (pattern < 0.82) {
      // Can do either seating on ONE day
      const day = Math.random() < 0.5 ? 0 : 2;
      availableIdxs = [day, day + 1];
    } else if (pattern < 0.90) {
      // Can do 3 of 4
      const skip = Math.floor(Math.random() * 4);
      availableIdxs = [0, 1, 2, 3].filter((i) => i !== skip);
    } else {
      // Can do any — but still ranks preference
      availableIdxs = [0, 1, 2, 3];
    }

    // Rank available ones
    const ranked = shuffle([...availableIdxs]);

    for (let s = 0; s < 4; s++) {
      const isAvail = availableIdxs.includes(s);
      const rankPos = ranked.indexOf(s);
      // Most people rank their picks
      const rank = isAvail ? rankPos + 1 : null;
      slotRows.push({ response_id: rid, option_id: optionIds[s], status: isAvail ? "available" : "unable", rank });
    }
  }

  await supabase.from("poll_tokens").insert(tokenRows);
  await supabase.from("responses").insert(responseRows);
  await supabase.from("response_slots").insert(slotRows);

  return NextResponse.json({ pollId, members: members.length, slots: slots.length });
}
