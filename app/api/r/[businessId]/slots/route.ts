import { getAvailableSlots } from "@/lib/restaurant-queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const date = req.nextUrl.searchParams.get("date");
  const partySize = parseInt(req.nextUrl.searchParams.get("partySize") ?? "2", 10);

  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const slots = await getAvailableSlots(businessId, date, partySize);
  return NextResponse.json({ slots });
}
