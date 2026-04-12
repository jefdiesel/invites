"use server";

import { getDb } from "./db";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

// ---- Polls ----

export async function createPoll(formData: FormData) {
  const db = getDb();
  const id = randomUUID();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string || "";
  const location = formData.get("location") as string || "";
  const deadline = formData.get("deadline") as string || null;

  db.prepare(
    `INSERT INTO polls (id, title, description, location, deadline) VALUES (?, ?, ?, ?, ?)`
  ).run(id, title, description, location, deadline);

  const slotsJson = formData.get("slots") as string;
  if (slotsJson) {
    const slots: { label: string; starts_at: string; capacity: number | null }[] = JSON.parse(slotsJson);
    const stmt = db.prepare(
      `INSERT INTO options (id, poll_id, label, starts_at, capacity, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (let i = 0; i < slots.length; i++) {
      stmt.run(randomUUID(), id, slots[i].label, slots[i].starts_at, slots[i].capacity, i);
    }
  }

  revalidatePath("/");
  return { id };
}

export async function addSlotToPoll(pollId: string, label: string, startsAt: string) {
  const db = getDb();
  const maxOrder = db.prepare(
    `SELECT COALESCE(MAX(sort_order), -1) as m FROM options WHERE poll_id = ?`
  ).get(pollId) as { m: number };
  db.prepare(
    `INSERT INTO options (id, poll_id, label, starts_at, sort_order) VALUES (?, ?, ?, ?, ?)`
  ).run(randomUUID(), pollId, label, startsAt, maxOrder.m + 1);
  revalidatePath(`/poll/${pollId}`);
}

export async function addMembers(pollId: string, members: { name: string; email: string }[]) {
  const db = getDb();
  const memberStmt = db.prepare(
    `INSERT INTO roster_members (id, poll_id, name, email) VALUES (?, ?, ?, ?)`
  );
  const tokenStmt = db.prepare(
    `INSERT INTO poll_tokens (token, poll_id, member_id) VALUES (?, ?, ?)`
  );

  const insertAll = db.transaction(() => {
    for (const m of members) {
      const memberId = randomUUID();
      const token = randomUUID();
      memberStmt.run(memberId, pollId, m.name, m.email);
      tokenStmt.run(token, pollId, memberId);
    }
  });
  insertAll();
  revalidatePath(`/poll/${pollId}`);
}

export async function submitVote(
  token: string,
  flexibility: "flexible" | "inflexible",
  slots: { optionId: string; status: "available" | "unable"; rank: number | null }[],
  responseType: "voted" | "not_interested" | "none_work" = "voted"
) {
  const db = getDb();

  const tokenRow = db.prepare(
    `SELECT token, poll_id, member_id, used_at FROM poll_tokens WHERE token = ?`
  ).get(token) as { token: string; poll_id: string; member_id: string; used_at: string | null } | undefined;

  if (!tokenRow) throw new Error("Invalid voting link");
  if (tokenRow.used_at) throw new Error("You have already voted");

  const poll = db.prepare(`SELECT phase FROM polls WHERE id = ?`).get(tokenRow.poll_id) as { phase: string };
  if (poll.phase !== "polling") throw new Error("This poll is no longer accepting votes");

  const responseId = randomUUID();

  const insert = db.transaction(() => {
    db.prepare(
      `INSERT INTO responses (id, poll_id, member_id, flexibility, response_type) VALUES (?, ?, ?, ?, ?)`
    ).run(responseId, tokenRow.poll_id, tokenRow.member_id, flexibility, responseType);

    // Only insert slot responses for normal votes
    if (responseType === "voted") {
      const slotStmt = db.prepare(
        `INSERT INTO response_slots (response_id, option_id, status, rank) VALUES (?, ?, ?, ?)`
      );
      for (const s of slots) {
        slotStmt.run(responseId, s.optionId, s.status, s.rank);
      }
    }

    db.prepare(`UPDATE poll_tokens SET used_at = datetime('now') WHERE token = ?`).run(token);
  });
  insert();

  revalidatePath(`/poll/${tokenRow.poll_id}`);
}

export async function updatePhase(pollId: string, phase: "polling" | "confirming" | "notified") {
  const db = getDb();
  db.prepare(`UPDATE polls SET phase = ? WHERE id = ?`).run(phase, pollId);
  revalidatePath(`/poll/${pollId}`);
}

export async function toggleConfirmed(optionId: string) {
  const db = getDb();
  db.prepare(`UPDATE options SET confirmed = NOT confirmed WHERE id = ?`).run(optionId);
}

export async function updateCapacity(optionId: string, capacity: number | null) {
  const db = getDb();
  db.prepare(`UPDATE options SET capacity = ? WHERE id = ?`).run(capacity, optionId);
}

// Assign members to confirmed slots WITHOUT changing phase or sending notifications
export async function assignMembers(pollId: string) {
  const db = getDb();

  // Clear previous offers
  db.prepare(`DELETE FROM offers WHERE response_id IN (SELECT id FROM responses WHERE poll_id = ?)`).run(pollId);

  // Get confirmed options with capacity
  const confirmedOptions = db.prepare(
    `SELECT id, capacity FROM options WHERE poll_id = ? AND confirmed = 1 ORDER BY sort_order`
  ).all(pollId) as { id: string; capacity: number | null }[];

  const capacityLeft = new Map<string, number>();
  for (const opt of confirmedOptions) {
    capacityLeft.set(opt.id, opt.capacity ?? Infinity);
  }

  // Get voted responses sorted by constraint (fewest available confirmed slots first)
  const responses = db.prepare(`
    SELECT r.id as response_id, r.member_id, r.flexibility,
           COUNT(CASE WHEN rs.status = 'available' AND o.confirmed = 1 THEN 1 END) as available_count
    FROM responses r
    JOIN response_slots rs ON rs.response_id = r.id
    JOIN options o ON o.id = rs.option_id
    WHERE r.poll_id = ? AND r.response_type = 'voted'
    GROUP BY r.id
    ORDER BY available_count ASC, CASE WHEN r.flexibility = 'inflexible' THEN 0 ELSE 1 END
  `).all(pollId) as { response_id: string; member_id: string; flexibility: string; available_count: number }[];

  const offerStmt = db.prepare(
    `INSERT INTO offers (response_id, option_id) VALUES (?, ?)`
  );

  const assignAll = db.transaction(() => {
    for (const resp of responses) {
      const slots = db.prepare(`
        SELECT rs.option_id, rs.rank
        FROM response_slots rs
        JOIN options o ON o.id = rs.option_id
        WHERE rs.response_id = ? AND rs.status = 'available' AND o.confirmed = 1
        ORDER BY COALESCE(rs.rank, 999999)
      `).all(resp.response_id) as { option_id: string; rank: number | null }[];

      for (const slot of slots) {
        const remaining = capacityLeft.get(slot.option_id) ?? 0;
        if (remaining > 0) {
          offerStmt.run(resp.response_id, slot.option_id);
          capacityLeft.set(slot.option_id, remaining - 1);
        }
      }
    }
  });
  assignAll();

  revalidatePath(`/poll/${pollId}`);
}

// Send notifications and move to notified phase (separate from assignment)
export async function sendNotifications(pollId: string) {
  const db = getDb();
  db.prepare(`UPDATE polls SET phase = 'notified' WHERE id = ?`).run(pollId);
  // TODO: actually send emails via Resend
  revalidatePath(`/poll/${pollId}`);
}
