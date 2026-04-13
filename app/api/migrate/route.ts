import { supabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const results: string[] = [];

  // Test which tables exist
  const tableNames = [
    "clients", "businesses", "business_hours", "services",
    "business_clients", "bookings", "menu_items", "client_sensitive",
    "members", "events", "reviews", "ticket_purchases",
  ];

  const missing: string[] = [];
  for (const t of tableNames) {
    const { error } = await supabase.from(t).select("id").limit(1);
    if (error) missing.push(t);
    results.push(`${t}: ${error ? "MISSING" : "OK"}`);
  }

  // For missing tables, try to create them via individual inserts
  // Supabase REST API can't run DDL, so we return the SQL to run manually
  // BUT we can create the exec_sql function first, then use it

  if (missing.length > 0) {
    // Try creating exec_sql function
    // This won't work via REST either — we need it pre-created
    // Let's try a different approach: use supabase-js admin API

    return NextResponse.json({
      status: "tables_missing",
      results,
      missing,
      action: "Run the SQL in lib/schema.sql via the Supabase SQL Editor at https://supabase.com/dashboard/project/zfloaxeibcnfklqvydam/sql/new",
    });
  }

  return NextResponse.json({ status: "all_ok", results });
}
