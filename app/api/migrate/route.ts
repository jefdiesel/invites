import { supabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const results: string[] = [];

  // 1. Persistent members table (global identity, not per-poll)
  const { error: e1 } = await supabase.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        city TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `,
  });
  if (e1) {
    // Fallback: try raw SQL via REST
    const r1 = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({
        sql: `CREATE TABLE IF NOT EXISTS members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          city TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT now()
        );`,
      }),
    });
    results.push(`members table: ${r1.ok ? "created" : "failed"}`);
  } else {
    results.push("members table: created");
  }

  return NextResponse.json({
    message: "Use Supabase SQL editor to run migrations",
    results,
    sql: MIGRATION_SQL,
  });
}

const MIGRATION_SQL = `
-- Persistent members (global identity)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  city TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link roster_members to persistent members
ALTER TABLE roster_members ADD COLUMN IF NOT EXISTS member_ref UUID REFERENCES members(id);

-- Events (completed/confirmed events with retained data)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id),
  title TEXT NOT NULL,
  location TEXT DEFAULT '',
  description TEXT DEFAULT '',
  menu TEXT DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL,
  capacity INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket purchases
CREATE TABLE IF NOT EXISTS ticket_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1,
  amount_cents INT DEFAULT 0,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT DEFAULT ''
);

-- Reviews (post-event)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  body TEXT DEFAULT '' CHECK (char_length(body) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, event_id)
);

-- RLS policies (allow all for now, same as existing tables)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all ticket_purchases" ON ticket_purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
`;
