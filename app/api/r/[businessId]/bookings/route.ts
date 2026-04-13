import { getBookingsForDate, getTodaysBookings } from "@/lib/restaurant-queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const date = req.nextUrl.searchParams.get("date");

  const bookings = date
    ? await getBookingsForDate(businessId, date)
    : await getTodaysBookings(businessId);

  return NextResponse.json({ bookings });
}
