import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const FIRST_NAMES = [
  "Emma","Liam","Olivia","Noah","Ava","Ethan","Sophia","Mason","Isabella","William",
  "Mia","James","Charlotte","Benjamin","Amelia","Lucas","Harper","Henry","Evelyn","Alexander",
  "Abigail","Michael","Emily","Daniel","Elizabeth","Jacob","Sofia","Logan","Avery","Jackson",
  "Ella","Sebastian","Scarlett","Jack","Grace","Aiden","Chloe","Owen","Victoria","Samuel",
  "Riley","Ryan","Aria","Nathan","Lily","Carter","Aurora","Luke","Zoey","Dylan",
];
const LAST_NAMES = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
  "Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin",
  "Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson",
  "Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
  "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST() {
  const db = getDb();

  // Create poll
  const pollId = randomUUID();
  db.prepare(
    `INSERT INTO polls (id, title, description, location, deadline, phase) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    pollId,
    "Summer Dinner Series",
    "Monthly dinner events for June through August. Pick the dates that work best for you!",
    "The Lakehouse Restaurant",
    "2026-05-01T23:59",
    "confirming"
  );

  // Create 5 slots with capacities
  const slots = [
    { label: "Friday June 12th", starts_at: "2026-06-12T19:00", capacity: 24 },
    { label: "Saturday June 20th", starts_at: "2026-06-20T18:30", capacity: 30 },
    { label: "Friday July 10th", starts_at: "2026-07-10T19:00", capacity: 24 },
    { label: "Saturday July 25th", starts_at: "2026-07-25T18:30", capacity: 30 },
    { label: "Saturday August 15th", starts_at: "2026-08-15T18:00", capacity: 36 },
  ];

  const optionIds: string[] = [];
  const optStmt = db.prepare(
    `INSERT INTO options (id, poll_id, label, starts_at, capacity, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
  );
  for (let i = 0; i < slots.length; i++) {
    const oid = randomUUID();
    optionIds.push(oid);
    optStmt.run(oid, pollId, slots[i].label, slots[i].starts_at, slots[i].capacity, i);
  }

  // Confirm some slots
  db.prepare(`UPDATE options SET confirmed = 1 WHERE id IN (?, ?, ?)`).run(
    optionIds[0], optionIds[1], optionIds[3]
  );

  // Create 100 members
  const memberStmt = db.prepare(
    `INSERT INTO roster_members (id, poll_id, name, email) VALUES (?, ?, ?, ?)`
  );
  const tokenStmt = db.prepare(
    `INSERT INTO poll_tokens (token, poll_id, member_id, used_at) VALUES (?, ?, ?, ?)`
  );
  const respStmt = db.prepare(
    `INSERT INTO responses (id, poll_id, member_id, flexibility, response_type) VALUES (?, ?, ?, ?, ?)`
  );
  const slotStmt = db.prepare(
    `INSERT INTO response_slots (response_id, option_id, status, rank) VALUES (?, ?, ?, ?)`
  );

  const usedNames = new Set<string>();
  const members: { id: string; name: string }[] = [];

  for (let i = 0; i < 100; i++) {
    let name: string;
    do {
      name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const memberId = randomUUID();
    const email = `${name.toLowerCase().replace(" ", ".")}@example.com`;
    members.push({ id: memberId, name });
    memberStmt.run(memberId, pollId, name, email);
  }

  // Simulate votes
  const seed = db.transaction(() => {
    for (const member of members) {
      const token = randomUUID();
      const rand = Math.random();

      if (rand < 0.10) {
        // 10% don't vote
        tokenStmt.run(token, pollId, member.id, null);
        continue;
      }

      tokenStmt.run(token, pollId, member.id, new Date().toISOString());

      if (rand < 0.15) {
        // 5% not interested
        const rid = randomUUID();
        respStmt.run(rid, pollId, member.id, "flexible", "not_interested");
        continue;
      }

      if (rand < 0.22) {
        // 7% none work
        const rid = randomUUID();
        respStmt.run(rid, pollId, member.id, pick(["flexible", "inflexible"]), "none_work");
        continue;
      }

      // Normal vote
      const rid = randomUUID();
      const flex = Math.random() < 0.3 ? "inflexible" : "flexible";
      respStmt.run(rid, pollId, member.id, flex, "voted");

      // Random availability: each slot 50-80% chance of available
      const availableSlots: number[] = [];
      for (let s = 0; s < optionIds.length; s++) {
        const isAvail = Math.random() < (0.5 + Math.random() * 0.3);
        if (isAvail) availableSlots.push(s);
      }

      // If no slots available, force at least one
      if (availableSlots.length === 0) {
        availableSlots.push(Math.floor(Math.random() * optionIds.length));
      }

      // Assign random ranks to available slots
      const ranked = shuffle(availableSlots);
      for (let s = 0; s < optionIds.length; s++) {
        const isAvail = availableSlots.includes(s);
        const rankIdx = ranked.indexOf(s);
        // 70% chance of ranking if available
        const rank = isAvail && Math.random() < 0.7 ? rankIdx + 1 : null;
        slotStmt.run(rid, optionIds[s], isAvail ? "available" : "unable", rank);
      }
    }
  });
  seed();

  return NextResponse.json({ pollId, members: members.length });
}
