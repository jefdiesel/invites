"use server";

import { supabase } from "./db";
import { getGuestSession } from "./guest-auth";
import { sendCancellationEmail } from "./email";
import { sendCancellationSMS } from "./sms";

export async function getGuestBookings(email: string) {
  const today = new Date().toISOString().split("T")[0];

  // Get client id
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, phone")
    .eq("email", email)
    .single();

  if (!client) return { upcoming: [], past: [], guest: null };

  // Upcoming
  const { data: upcoming } = await supabase
    .from("bookings")
    .select("*, businesses(name, slug, phone)")
    .eq("client_id", client.id)
    .gte("booking_date", today)
    .in("status", ["confirmed", "seated"])
    .order("booking_date")
    .order("booking_time")
    .limit(20);

  // Past
  const { data: past } = await supabase
    .from("bookings")
    .select("*, businesses(name, slug)")
    .eq("client_id", client.id)
    .or(`booking_date.lt.${today},status.in.(completed,cancelled,no_show)`)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false })
    .limit(20);

  return {
    upcoming: upcoming ?? [],
    past: past ?? [],
    guest: { name: client.name, email, phone: client.phone },
  };
}

export async function guestCancelBooking(bookingId: string) {
  const session = await getGuestSession();
  if (!session) throw new Error("Not logged in");

  // Verify this booking belongs to this guest
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, clients(name, email, phone), businesses(name, slug)")
    .eq("id", bookingId)
    .single();

  if (!booking) throw new Error("Booking not found");

  const client = booking.clients as unknown as { name: string; email: string; phone: string } | null;
  if (client?.email !== session.email) throw new Error("Not your booking");

  // Cancel
  await supabase.from("bookings").update({
    status: "cancelled",
    updated_at: new Date().toISOString(),
  }).eq("id", bookingId);

  const biz = booking.businesses as unknown as { name: string; slug: string } | null;
  if (biz && client) {
    await sendCancellationEmail({
      guestEmail: client.email, guestName: client.name, restaurantName: biz.name,
      date: booking.booking_date, time: booking.booking_time,
      partySize: booking.party_size, slug: biz.slug,
    });
    if (client.phone) {
      await sendCancellationSMS({
        phone: client.phone, restaurantName: biz.name,
        date: booking.booking_date, time: booking.booking_time, slug: biz.slug,
      });
    }
  }
}
