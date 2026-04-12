import { getDb } from "./db";

export function getPolls() {
  const db = getDb();
  return db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM responses r WHERE r.poll_id = p.id) as response_count,
      (SELECT COUNT(*) FROM roster_members rm WHERE rm.poll_id = p.id) as member_count
    FROM polls p ORDER BY p.created_at DESC
  `).all() as { id: string; title: string; phase: string; response_count: number; member_count: number }[];
}

export function getPoll(id: string) {
  const db = getDb();
  const poll = db.prepare(`SELECT * FROM polls WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!poll) return null;

  const options = db.prepare(`SELECT * FROM options WHERE poll_id = ? ORDER BY sort_order`).all(id);
  const members = db.prepare(`SELECT * FROM roster_members WHERE poll_id = ?`).all(id);
  const tokens = db.prepare(`SELECT * FROM poll_tokens WHERE poll_id = ?`).all(id);
  const responses = db.prepare(`SELECT * FROM responses WHERE poll_id = ?`).all(id);

  return { ...poll, options, members, tokens, responses };
}

export function getPollResults(pollId: string) {
  const db = getDb();

  const poll = db.prepare(`SELECT * FROM polls WHERE id = ?`).get(pollId) as Record<string, unknown> | undefined;
  if (!poll) return null;

  const options = db.prepare(`SELECT * FROM options WHERE poll_id = ? ORDER BY sort_order`).all(pollId) as {
    id: string; label: string; starts_at: string; capacity: number | null; confirmed: number; sort_order: number;
  }[];

  const totalResponses = (db.prepare(`SELECT COUNT(*) as c FROM responses WHERE poll_id = ?`).get(pollId) as { c: number }).c;
  const votedCount = (db.prepare(`SELECT COUNT(*) as c FROM responses WHERE poll_id = ? AND response_type = 'voted'`).get(pollId) as { c: number }).c;
  const notInterestedCount = (db.prepare(`SELECT COUNT(*) as c FROM responses WHERE poll_id = ? AND response_type = 'not_interested'`).get(pollId) as { c: number }).c;
  const noneWorkCount = (db.prepare(`SELECT COUNT(*) as c FROM responses WHERE poll_id = ? AND response_type = 'none_work'`).get(pollId) as { c: number }).c;
  const inflexibleCount = (db.prepare(`SELECT COUNT(*) as c FROM responses WHERE poll_id = ? AND flexibility = 'inflexible' AND response_type = 'voted'`).get(pollId) as { c: number }).c;
  const flexibleCount = votedCount - inflexibleCount;

  const slotStats = options.map((opt) => {
    const available = (db.prepare(`
      SELECT COUNT(*) as c FROM response_slots rs
      JOIN responses r ON r.id = rs.response_id
      WHERE rs.option_id = ? AND rs.status = 'available' AND r.response_type = 'voted'
    `).get(opt.id) as { c: number }).c;

    const unable = (db.prepare(`
      SELECT COUNT(*) as c FROM response_slots rs
      JOIN responses r ON r.id = rs.response_id
      WHERE rs.option_id = ? AND rs.status = 'unable' AND r.response_type = 'voted'
    `).get(opt.id) as { c: number }).c;

    const onlyOption = (db.prepare(`
      SELECT COUNT(*) as c FROM responses r
      WHERE r.poll_id = ? AND r.response_type = 'voted'
      AND r.id IN (
        SELECT rs1.response_id FROM response_slots rs1
        WHERE rs1.option_id = ? AND rs1.status = 'available'
      )
      AND (
        SELECT COUNT(*) FROM response_slots rs2
        WHERE rs2.response_id = r.id AND rs2.status = 'available'
      ) = 1
    `).get(pollId, opt.id) as { c: number }).c;

    const bordaRows = db.prepare(`
      SELECT rs.rank,
        (SELECT COUNT(*) FROM response_slots rs2 WHERE rs2.response_id = rs.response_id AND rs2.status = 'available') as n_available
      FROM response_slots rs
      JOIN responses r ON r.id = rs.response_id
      WHERE rs.option_id = ? AND rs.status = 'available' AND r.response_type = 'voted'
    `).all(opt.id) as { rank: number | null; n_available: number }[];

    let bordaScore = 0;
    for (const row of bordaRows) {
      if (row.rank != null) {
        bordaScore += Math.max(0, row.n_available - row.rank + 1);
      } else {
        bordaScore += 0.5;
      }
    }

    const inflexAvailable = (db.prepare(`
      SELECT COUNT(*) as c FROM response_slots rs
      JOIN responses r ON r.id = rs.response_id
      WHERE rs.option_id = ? AND rs.status = 'available' AND r.flexibility = 'inflexible' AND r.response_type = 'voted'
    `).get(opt.id) as { c: number }).c;

    const inflexUnable = (db.prepare(`
      SELECT COUNT(*) as c FROM response_slots rs
      JOIN responses r ON r.id = rs.response_id
      WHERE rs.option_id = ? AND rs.status = 'unable' AND r.flexibility = 'inflexible' AND r.response_type = 'voted'
    `).get(opt.id) as { c: number }).c;

    // Count offers for this slot
    const assignedCount = (db.prepare(`
      SELECT COUNT(*) as c FROM offers o
      JOIN responses r ON r.id = o.response_id
      WHERE o.option_id = ? AND r.poll_id = ?
    `).get(opt.id, pollId) as { c: number }).c;

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

  const members = db.prepare(`
    SELECT rm.id, rm.name, rm.email, pt.used_at,
      r.id as response_id, r.flexibility, r.response_type
    FROM roster_members rm
    LEFT JOIN poll_tokens pt ON pt.member_id = rm.id AND pt.poll_id = ?
    LEFT JOIN responses r ON r.member_id = rm.id AND r.poll_id = ?
    WHERE rm.poll_id = ?
    ORDER BY rm.name
  `).all(pollId, pollId, pollId) as {
    id: string; name: string; email: string; used_at: string | null;
    response_id: string | null; flexibility: string | null; response_type: string | null;
  }[];

  const memberSlots = db.prepare(`
    SELECT rs.response_id, rs.option_id, rs.status, rs.rank
    FROM response_slots rs
    JOIN responses r ON r.id = rs.response_id
    WHERE r.poll_id = ? AND r.response_type = 'voted'
  `).all(pollId) as { response_id: string; option_id: string; status: string; rank: number | null }[];

  const offers = db.prepare(`
    SELECT o.response_id, o.option_id, rm.name, rm.email
    FROM offers o
    JOIN responses r ON r.id = o.response_id
    JOIN roster_members rm ON rm.id = r.member_id
    WHERE r.poll_id = ?
  `).all(pollId) as { response_id: string; option_id: string; name: string; email: string }[];

  // Has assignments been run?
  const hasOffers = offers.length > 0;

  return {
    poll,
    options: slotStats,
    totalResponses,
    votedCount,
    notInterestedCount,
    noneWorkCount,
    flexibleCount,
    inflexibleCount,
    members,
    memberSlots,
    offers,
    hasOffers,
  };
}

export function getSlotAttendees(pollId: string, optionId: string) {
  const db = getDb();

  const option = db.prepare(`SELECT * FROM options WHERE id = ? AND poll_id = ?`).get(optionId, pollId) as {
    id: string; label: string; starts_at: string; capacity: number | null; confirmed: number;
  } | undefined;
  if (!option) return null;

  const poll = db.prepare(`SELECT id, title, phase FROM polls WHERE id = ?`).get(pollId) as {
    id: string; title: string; phase: string;
  };

  // Assigned members (have offers)
  const assigned = db.prepare(`
    SELECT rm.name, rm.email, r.flexibility, rs.rank
    FROM offers o
    JOIN responses r ON r.id = o.response_id
    JOIN roster_members rm ON rm.id = r.member_id
    LEFT JOIN response_slots rs ON rs.response_id = r.id AND rs.option_id = o.option_id
    WHERE o.option_id = ? AND r.poll_id = ?
    ORDER BY COALESCE(rs.rank, 999), rm.name
  `).all(optionId, pollId) as { name: string; email: string; flexibility: string; rank: number | null }[];

  // Available but NOT assigned (waitlist / overflow)
  const waitlist = db.prepare(`
    SELECT rm.name, rm.email, r.flexibility, rs.rank
    FROM response_slots rs
    JOIN responses r ON r.id = rs.response_id
    JOIN roster_members rm ON rm.id = r.member_id
    WHERE rs.option_id = ? AND rs.status = 'available' AND r.poll_id = ? AND r.response_type = 'voted'
    AND r.id NOT IN (SELECT o.response_id FROM offers o WHERE o.option_id = ?)
    ORDER BY COALESCE(rs.rank, 999), rm.name
  `).all(optionId, pollId, optionId) as { name: string; email: string; flexibility: string; rank: number | null }[];

  // All who marked available (for pre-assignment view)
  const allAvailable = db.prepare(`
    SELECT rm.name, rm.email, r.flexibility, rs.rank
    FROM response_slots rs
    JOIN responses r ON r.id = rs.response_id
    JOIN roster_members rm ON rm.id = r.member_id
    WHERE rs.option_id = ? AND rs.status = 'available' AND r.poll_id = ? AND r.response_type = 'voted'
    ORDER BY COALESCE(rs.rank, 999), rm.name
  `).all(optionId, pollId) as { name: string; email: string; flexibility: string; rank: number | null }[];

  return { poll, option, assigned, waitlist, allAvailable };
}

export function getVoteData(token: string) {
  const db = getDb();
  const tokenRow = db.prepare(
    `SELECT token, poll_id, member_id, used_at FROM poll_tokens WHERE token = ?`
  ).get(token) as { token: string; poll_id: string; member_id: string; used_at: string | null } | undefined;

  if (!tokenRow) return null;

  const poll = db.prepare(`SELECT * FROM polls WHERE id = ?`).get(tokenRow.poll_id) as Record<string, unknown>;
  const options = db.prepare(`SELECT * FROM options WHERE poll_id = ? ORDER BY sort_order`).all(tokenRow.poll_id) as {
    id: string; label: string; starts_at: string; capacity: number | null; sort_order: number;
  }[];
  const member = db.prepare(`SELECT * FROM roster_members WHERE id = ?`).get(tokenRow.member_id) as { id: string; name: string; email: string };

  return {
    token: tokenRow.token,
    used: !!tokenRow.used_at,
    poll,
    options,
    member,
  };
}
