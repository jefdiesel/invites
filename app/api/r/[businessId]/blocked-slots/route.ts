import { getBlockedSlots } from "@/lib/restaurant-queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const date = request.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ blocked: [] });

  const slots = await getBlockedSlots(businessId, date);
  // Return as array of "HH:MM" strings for slots blocked for all sizes (table_size=0)
  const blocked = slots.filter(s => s.table_size === 0).map(s => s.slot_time.slice(0, 5));
  return NextResponse.json({ blocked });
}
