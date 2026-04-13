import { supabase } from "./db";

export async function getBusiness(slug: string) {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function getBusinessHours(businessId: string) {
  const { data } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", businessId)
    .order("day_of_week");
  return data ?? [];
}

export async function getMenuItems(businessId: string) {
  const { data } = await supabase
    .from("menu_items")
    .select("*")
    .eq("business_id", businessId)
    .eq("available", true)
    .order("sort_order");
  return data ?? [];
}

export async function getServices(businessId: string) {
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("sort_order");
  return data ?? [];
}

export async function getBookingsForDate(businessId: string, date: string) {
  const { data } = await supabase
    .from("bookings")
    .select("*, clients(name, email, phone)")
    .eq("business_id", businessId)
    .eq("booking_date", date)
    .neq("status", "cancelled")
    .order("booking_time");
  return data ?? [];
}

export async function getTodaysBookings(businessId: string) {
  const today = new Date().toISOString().split("T")[0];
  return getBookingsForDate(businessId, today);
}

export async function getUpcomingBookings(businessId: string, days = 7) {
  const today = new Date().toISOString().split("T")[0];
  const end = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];
  const { data } = await supabase
    .from("bookings")
    .select("*, clients(name, email, phone)")
    .eq("business_id", businessId)
    .gte("booking_date", today)
    .lte("booking_date", end)
    .neq("status", "cancelled")
    .order("booking_date")
    .order("booking_time");
  return data ?? [];
}

export async function getBusinessClients(businessId: string) {
  const { data } = await supabase
    .from("business_clients")
    .select("*, clients(name, email, phone, city)")
    .eq("business_id", businessId)
    .order("last_visit", { ascending: false });
  return data ?? [];
}

export async function getBusinessClient(businessId: string, clientId: string) {
  const { data } = await supabase
    .from("business_clients")
    .select("*, clients(name, email, phone, city)")
    .eq("business_id", businessId)
    .eq("client_id", clientId)
    .single();
  return data;
}

export async function getClientBookings(businessId: string, clientId: string) {
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("business_id", businessId)
    .eq("client_id", clientId)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false });
  return data ?? [];
}

export async function getAvailableSlots(businessId: string, date: string, partySize: number) {
  // Get business hours for this day of week
  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  const { data: hours } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", businessId)
    .eq("day_of_week", dayOfWeek)
    .single();

  if (!hours || hours.is_closed) return [];

  // Get business config
  const { data: biz } = await supabase
    .from("businesses")
    .select("slot_duration_minutes")
    .eq("id", businessId)
    .single();

  const slotDuration = biz?.slot_duration_minutes ?? 90;

  // Get services (tables) that fit party size
  const { data: tables } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .eq("active", true)
    .gte("capacity", partySize)
    .order("capacity"); // prefer smallest table that fits

  if (!tables || tables.length === 0) return [];

  // Get existing bookings for this date
  const existingBookings = await getBookingsForDate(businessId, date);

  // Generate time slots from open to last_seating (or close - slotDuration)
  const openMinutes = timeToMinutes(hours.open_time);
  const lastSeating = hours.last_seating
    ? timeToMinutes(hours.last_seating)
    : timeToMinutes(hours.close_time) - slotDuration;

  const slots: { time: string; available: boolean }[] = [];

  for (let mins = openMinutes; mins <= lastSeating; mins += 30) {
    const timeStr = minutesToTime(mins);
    // Check if any table is available at this time
    const available = tables.some((table) => {
      const conflicting = existingBookings.filter((b) => {
        if (b.service_id && b.service_id !== table.id) return false;
        const bMins = timeToMinutes(b.booking_time);
        const bEnd = bMins + (b.duration_minutes || slotDuration);
        const slotEnd = mins + slotDuration;
        return mins < bEnd && slotEnd > bMins; // overlap check
      });
      // Count bookings for this specific table at this time
      const tableBookings = conflicting.filter((b) => b.service_id === table.id).length;
      return tableBookings < table.quantity;
    });

    slots.push({ time: timeStr, available });
  }

  return slots;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
