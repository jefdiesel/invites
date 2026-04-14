import { supabase } from "./db";

export async function hasAdmins(businessId: string): Promise<boolean> {
  const { count } = await supabase
    .from("business_admins")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);
  return (count ?? 0) > 0;
}

export async function getBusiness(slug: string) {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function getBusinessByDomain(domain: string) {
  const { data } = await supabase
    .from("businesses")
    .select("slug")
    .eq("custom_domain", domain)
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

export async function getMenuItems(businessId: string, includeUnavailable = false) {
  let query = supabase
    .from("menu_items")
    .select("*")
    .eq("business_id", businessId);
  if (!includeUnavailable) query = query.eq("available", true);
  const { data } = await query
    .order("sort_order");
  return data ?? [];
}

export async function getBusinessPhotos(businessId: string, category?: string) {
  let query = supabase
    .from("business_photos")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order");
  if (category) query = query.eq("category", category);
  const { data } = await query;
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

export async function getTables(businessId: string) {
  const { data } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("business_id", businessId)
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

export async function getBookingsForRange(businessId: string, startDate: string, endDate: string) {
  const { data } = await supabase
    .from("bookings")
    .select("*, clients(name, email, phone)")
    .eq("business_id", businessId)
    .gte("booking_date", startDate)
    .lte("booking_date", endDate)
    .neq("status", "cancelled")
    .order("booking_date")
    .order("booking_time");
  return data ?? [];
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

export async function getAllBookings(businessId: string) {
  const { data } = await supabase
    .from("bookings")
    .select("*, clients(name, email, phone)")
    .eq("business_id", businessId)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false })
    .limit(500);
  return data ?? [];
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
    .select("slot_duration_minutes, min_advance_minutes, slot_interval_minutes")
    .eq("id", businessId)
    .single();

  const minAdvance = biz?.min_advance_minutes ?? 120;
  const slotInterval = biz?.slot_interval_minutes ?? 30;

  // Determine which table size this party needs (strict — no upsizing)
  // 1-2 → 2, 3-4 → 4, 5-6 → 6, 7-8 → 8, etc.
  const neededSize = partySize <= 2 ? 2 : partySize <= 4 ? 4 : Math.ceil(partySize / 2) * 2;

  // Get inventory for this size
  const { data: inventory } = await supabase
    .from("table_inventory")
    .select("*")
    .eq("business_id", businessId)
    .eq("size", neededSize)
    .single();

  // Fallback: try restaurant_tables if no inventory configured yet
  if (!inventory) {
    const { data: tables } = await supabase
      .from("restaurant_tables")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .gte("capacity", partySize)
      .order("capacity");

    if (!tables || tables.length === 0) return [];

    // Legacy path — use restaurant_tables
    const slotDuration = biz?.slot_duration_minutes ?? 90;
    const existingBookings = await getBookingsForDate(businessId, date);
    const openMinutes = timeToMinutes(hours.open_time);
    const lastSeating = hours.last_seating
      ? timeToMinutes(hours.last_seating)
      : timeToMinutes(hours.close_time) - slotDuration;

    const now = new Date();
    const isToday = date === now.toISOString().split("T")[0];
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const earliestMins = isToday ? nowMins + minAdvance : 0;

    const slots: { time: string; available: boolean }[] = [];
    for (let mins = openMinutes; mins <= lastSeating; mins += slotInterval) {
      if (mins < earliestMins) { slots.push({ time: minutesToTime(mins), available: false }); continue; }
      const available = tables.some((table) => {
        const conflict = existingBookings.some((b) => {
          if (b.table_id !== table.id) return false;
          const bMins = timeToMinutes(b.booking_time);
          const bEnd = bMins + (b.duration_minutes || slotDuration);
          return mins < bEnd && (mins + slotDuration) > bMins;
        });
        return !conflict;
      });
      slots.push({ time: minutesToTime(mins), available });
    }
    return slots;
  }

  // New inventory-based availability
  const tableCount = inventory.count;
  const turnTime = inventory.turn_time_minutes;

  // Get blocked slots for this date
  const blockedSlots = await getBlockedSlots(businessId, date);
  // If any row has table_size=0, the whole day is blocked
  const dayBlocked = blockedSlots.some(b => b.table_size === 0);
  if (dayBlocked) return [];
  const blockedSet = new Set(
    blockedSlots
      .filter(b => b.table_size === neededSize)
      .map(b => b.slot_time.slice(0, 5))
  );

  // Get existing bookings for this date that use this table size
  const existingBookings = await getBookingsForDate(businessId, date);

  // Filter to bookings that would use this size
  const relevantBookings = existingBookings.filter(b => {
    const ps = b.party_size;
    const bookedSize = ps <= 2 ? 2 : ps <= 4 ? 4 : Math.ceil(ps / 2) * 2;
    return bookedSize === neededSize;
  });

  const openMinutes = timeToMinutes(hours.open_time);
  const lastSeating = hours.last_seating
    ? timeToMinutes(hours.last_seating)
    : timeToMinutes(hours.close_time) - turnTime;

  // 2-hour minimum advance
  const now = new Date();
  const isToday = date === now.toISOString().split("T")[0];
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const earliestMins = isToday ? nowMins + minAdvance : 0;

  const slots: { time: string; available: boolean }[] = [];

  for (let mins = openMinutes; mins <= lastSeating; mins += slotInterval) {
    const timeStr = minutesToTime(mins);

    // Enforce minimum advance
    if (mins < earliestMins) {
      slots.push({ time: timeStr, available: false });
      continue;
    }

    // Check if slot is blocked by manager
    if (blockedSet.has(timeStr)) {
      slots.push({ time: timeStr, available: false });
      continue;
    }

    // Count how many tables of this size are booked at this time (overlap check)
    const overlapping = relevantBookings.filter(b => {
      const bMins = timeToMinutes(b.booking_time);
      const bEnd = bMins + (b.duration_minutes || turnTime);
      const slotEnd = mins + turnTime;
      return mins < bEnd && slotEnd > bMins;
    });

    const available = overlapping.length < tableCount;
    slots.push({ time: timeStr, available });
  }

  return slots;
}

// ── Blocked Slots ──

export async function getBlockedSlots(businessId: string, date: string) {
  const dow = new Date(date + "T12:00:00").getDay();

  // Get all: exact date match, recurring by weekday, or recurring every day
  const { data } = await supabase
    .from("blocked_slots")
    .select("slot_time, table_size, slot_date, day_of_week")
    .eq("business_id", businessId)
    .or(`slot_date.eq.${date},and(slot_date.is.null,day_of_week.eq.${dow}),and(slot_date.is.null,day_of_week.is.null)`);

  return data ?? [];
}

// ── Table Inventory ──

export async function getTableInventory(businessId: string) {
  const { data } = await supabase
    .from("table_inventory")
    .select("*")
    .eq("business_id", businessId)
    .order("size");
  return data ?? [];
}

// ── Waitlist ──

export async function getWaitlist(businessId: string) {
  const { data } = await supabase
    .from("waitlist_entries")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "waiting")
    .order("created_at");
  return data ?? [];
}

// ── Analytics ──

export async function getBookingStats(businessId: string, days = 30) {
  const start = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const { data } = await supabase
    .from("bookings")
    .select("booking_date, booking_time, party_size, status, source")
    .eq("business_id", businessId)
    .gte("booking_date", start)
    .order("booking_date");
  return data ?? [];
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
