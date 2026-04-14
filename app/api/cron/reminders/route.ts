import { supabase } from "@/lib/db";
import { sendBookingReminder } from "@/lib/email";
import { sendBookingReminderSMS } from "@/lib/sms";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Runs daily — sends reminders for tomorrow's bookings
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, party_size, business_id, client_id, clients(name, email, phone), businesses(name, slug)")
    .eq("booking_date", tomorrow)
    .eq("status", "confirmed");

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0, date: tomorrow });
  }

  let sent = 0;
  for (const b of bookings) {
    const client = b.clients as unknown as { name: string; email: string; phone: string } | null;
    const biz = b.businesses as unknown as { name: string; slug: string } | null;
    if (!client || !biz) continue;

    if (client.email) {
      await sendBookingReminder({
        guestEmail: client.email, guestName: client.name, restaurantName: biz.name,
        date: b.booking_date, time: b.booking_time, partySize: b.party_size,
        slug: biz.slug, bookingId: b.id,
      });
    }

    if (client.phone) {
      await sendBookingReminderSMS({
        phone: client.phone, guestName: client.name, restaurantName: biz.name,
        time: b.booking_time, partySize: b.party_size,
      });
    }

    sent++;
  }

  return NextResponse.json({ sent, date: tomorrow });
}
