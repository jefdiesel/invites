"use server";

import { supabase } from "./db";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { takeSnapshot } from "./snapshots";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export async function createBooking(
  businessId: string,
  data: {
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    partySize: number;
    notes: string;
  }
) {
  // Find or create global client
  let clientId: string;
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("email", data.email)
    .single();

  if (existing) {
    clientId = existing.id;
    // Update name/phone if provided
    await supabase.from("clients").update({
      name: data.name || undefined,
      phone: data.phone || undefined,
    }).eq("id", clientId);
  } else {
    clientId = randomUUID();
    await supabase.from("clients").insert({
      id: clientId,
      name: data.name,
      email: data.email,
      phone: data.phone,
    });
  }

  // Find or create business_client
  const { data: bizClient } = await supabase
    .from("business_clients")
    .select("id, visit_count")
    .eq("business_id", businessId)
    .eq("client_id", clientId)
    .single();

  if (!bizClient) {
    await supabase.from("business_clients").insert({
      id: randomUUID(),
      business_id: businessId,
      client_id: clientId,
      first_visit: new Date(`${data.date}T${data.time}`).toISOString(),
      last_visit: new Date(`${data.date}T${data.time}`).toISOString(),
      visit_count: 1,
    });
  } else {
    await supabase.from("business_clients").update({
      last_visit: new Date(`${data.date}T${data.time}`).toISOString(),
      visit_count: (bizClient.visit_count || 0) + 1,
    }).eq("id", bizClient.id);
  }

  // Find best available physical table
  const { data: allTables } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .gte("capacity", data.partySize)
    .order("capacity"); // smallest table that fits

  // Get existing bookings that overlap this time
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("table_id, booking_time, duration_minutes")
    .eq("business_id", businessId)
    .eq("booking_date", data.date)
    .neq("status", "cancelled");

  const { data: bizConfig } = await supabase
    .from("businesses")
    .select("slot_duration_minutes")
    .eq("id", businessId)
    .single();
  const slotDuration = bizConfig?.slot_duration_minutes ?? 90;

  // Find first table not booked at this time
  let assignedTableId: string | null = null;
  const requestMins = timeToMinutes(data.time);
  const requestEnd = requestMins + slotDuration;

  for (const table of (allTables ?? [])) {
    const conflict = (existingBookings ?? []).some((b) => {
      if (b.table_id !== table.id) return false;
      const bMins = timeToMinutes(b.booking_time);
      const bEnd = bMins + (b.duration_minutes || slotDuration);
      return requestMins < bEnd && requestEnd > bMins;
    });
    if (!conflict) {
      assignedTableId = table.id;
      break;
    }
  }

  // Create booking
  const bookingId = randomUUID();
  await supabase.from("bookings").insert({
    id: bookingId,
    business_id: businessId,
    client_id: clientId,
    service_id: null,
    table_id: assignedTableId,
    booking_date: data.date,
    booking_time: data.time,
    party_size: data.partySize,
    notes: data.notes,
    status: "confirmed",
    source: "website",
  });

  revalidatePath(`/r/[slug]`, "layout");
  return { bookingId, clientId };
}

export async function updateBookingStatus(bookingId: string, status: string) {
  await supabase.from("bookings").update({
    status,
    updated_at: new Date().toISOString(),
  }).eq("id", bookingId);
}

export async function cancelBooking(bookingId: string) {
  await updateBookingStatus(bookingId, "cancelled");
}

export async function updateBusinessClientNotes(
  businessId: string,
  clientId: string,
  fields: { notes?: string; tags?: string[]; preferences?: string; dietary?: string }
) {
  await supabase.from("business_clients")
    .update(fields)
    .eq("business_id", businessId)
    .eq("client_id", clientId);
}

// ── Setup / Onboarding ──

export async function setupBusiness(
  businessId: string,
  slug: string,
  data: { adminEmail: string; staffPin: string; adminPassword: string }
) {
  // Add admin email to business_admins
  await supabase.from("business_admins").insert({
    id: randomUUID(),
    business_id: businessId,
    email: data.adminEmail.toLowerCase(),
    role: "admin",
  });

  // Set passwords on the business
  await supabase.from("businesses").update({
    staff_password: data.staffPin,
    admin_password: data.adminPassword,
  }).eq("id", businessId);

  revalidatePath(`/r/${slug}`, "layout");
}

// ── Auth ──

export async function loginWithPassword(slug: string, password: string): Promise<{ role: "staff" | "admin" | null }> {
  const { data: biz } = await supabase
    .from("businesses")
    .select("staff_password, admin_password")
    .eq("slug", slug)
    .single();

  if (!biz) return { role: null };

  // Check admin first (admin password also grants admin access)
  if (biz.admin_password && password === biz.admin_password) {
    return { role: "admin" };
  }
  if (biz.staff_password && password === biz.staff_password) {
    return { role: "staff" };
  }
  return { role: null };
}

// ── Magic Link Auth ──

export async function requestMagicLink(slug: string, email: string): Promise<{ ok: boolean; devToken?: string; error?: string }> {
  // Look up business
  const { data: biz } = await supabase.from("businesses").select("id").eq("slug", slug).single();
  if (!biz) return { ok: false, error: "Business not found" };

  // Check if email is authorized
  const { data: admin } = await supabase
    .from("business_admins")
    .select("role")
    .eq("business_id", biz.id)
    .eq("email", email.toLowerCase())
    .single();

  if (!admin) return { ok: false, error: "Email not authorized" };

  // Generate token
  const token = randomUUID() + "-" + randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await supabase.from("business_magic_links").insert({
    id: randomUUID(),
    business_id: biz.id,
    email: email.toLowerCase(),
    token,
    role: admin.role,
    expires_at: expiresAt.toISOString(),
  });

  // DEV MODE: return the token directly instead of emailing
  // TODO: Replace with Resend email in production
  return { ok: true, devToken: token };
}

export async function verifyMagicLink(token: string): Promise<{ role: string; slug: string } | null> {
  const { data: link } = await supabase
    .from("business_magic_links")
    .select("*, businesses(slug)")
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!link) return null;

  // Mark as used
  await supabase.from("business_magic_links").update({
    used_at: new Date().toISOString(),
  }).eq("id", link.id);

  return { role: link.role, slug: (link.businesses as { slug: string }).slug };
}

// ── Menu Management ──

export async function addMenuItem(businessId: string, data: {
  category: string; name: string; description: string; price_cents: number; dietary_flags: string[];
}) {
  const { data: maxOrder } = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("menu_items").insert({
    id: randomUUID(),
    business_id: businessId,
    ...data,
    sort_order: (maxOrder?.sort_order ?? 0) + 1,
  });
  revalidatePath(`/r/[slug]`, "layout");
}

export async function updateMenuItem(itemId: string, data: {
  category?: string; name?: string; description?: string; price_cents?: number;
  dietary_flags?: string[]; available?: boolean;
}) {
  await supabase.from("menu_items").update(data).eq("id", itemId);
  revalidatePath(`/r/[slug]`, "layout");
}

export async function deleteMenuItem(itemId: string) {
  // Get business ID for snapshot
  const { data: item } = await supabase.from("menu_items").select("business_id").eq("id", itemId).single();
  if (item) await takeSnapshot(item.business_id, "menu", "Before menu item delete");
  await supabase.from("menu_items").delete().eq("id", itemId);
  revalidatePath(`/r/[slug]`, "layout");
}

// ── Site Settings ──

export async function updateBusinessSettings(businessId: string, data: {
  name?: string; about?: string; about_story?: string; about_headline?: string;
  cuisine?: string; price_range?: string; address?: string; city?: string;
  state?: string; zip?: string; phone?: string; email?: string;
  cover_image_url?: string; logo_url?: string; theme?: string;
}) {
  await takeSnapshot(businessId, "settings", "Before settings update");
  await supabase.from("businesses").update(data).eq("id", businessId);
  revalidatePath(`/r/[slug]`, "layout");
}

// ── Hours Management ──

export async function updateBusinessHours(businessId: string, hours: {
  day_of_week: number; open_time: string; close_time: string;
  last_seating: string | null; is_closed: boolean;
}[]) {
  await takeSnapshot(businessId, "hours", "Before hours update");
  await supabase.from("business_hours").delete().eq("business_id", businessId);
  for (const h of hours) {
    await supabase.from("business_hours").insert({
      id: randomUUID(),
      business_id: businessId,
      ...h,
    });
  }
  revalidatePath(`/r/[slug]`, "layout");
}

// ── Photo Management ──

export async function addPhoto(businessId: string, data: {
  url: string; alt: string; caption: string; category: string;
}) {
  if (!data.alt.trim()) throw new Error("Alt text is required for accessibility");
  const { data: maxOrder } = await supabase
    .from("business_photos")
    .select("sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("business_photos").insert({
    id: randomUUID(),
    business_id: businessId,
    ...data,
    sort_order: (maxOrder?.sort_order ?? 0) + 1,
  });
  revalidatePath(`/r/[slug]`, "layout");
}

export async function deletePhoto(photoId: string) {
  const { data: photo } = await supabase.from("business_photos").select("business_id").eq("id", photoId).single();
  if (photo) await takeSnapshot(photo.business_id, "photos", "Before photo delete");
  await supabase.from("business_photos").delete().eq("id", photoId);
  revalidatePath(`/r/[slug]`, "layout");
}

// ── Booking Status Management ──

export async function seatBooking(bookingId: string) {
  await supabase.from("bookings").update({
    status: "seated",
    updated_at: new Date().toISOString(),
  }).eq("id", bookingId);
}

export async function completeBooking(bookingId: string) {
  await supabase.from("bookings").update({
    status: "completed",
    updated_at: new Date().toISOString(),
  }).eq("id", bookingId);
}

export async function noShowBooking(bookingId: string) {
  await supabase.from("bookings").update({
    status: "no_show",
    updated_at: new Date().toISOString(),
  }).eq("id", bookingId);
}

export async function assignTable(bookingId: string, tableId: string) {
  await supabase.from("bookings").update({
    table_id: tableId,
    updated_at: new Date().toISOString(),
  }).eq("id", bookingId);
}

// ── Table Management ──

export async function updateTablePosition(tableId: string, pos: { pos_x: number; pos_y: number }) {
  await supabase.from("restaurant_tables").update(pos).eq("id", tableId);
}

export async function updateTable(tableId: string, data: {
  name?: string; zone?: string; capacity?: number; shape?: string;
  width?: number; height?: number; is_active?: boolean;
}) {
  await supabase.from("restaurant_tables").update(data).eq("id", tableId);
  revalidatePath(`/r/[slug]`, "layout");
}

export async function addTable(businessId: string, data: {
  name: string; zone: string; capacity: number; shape: string;
}) {
  const { data: maxOrder } = await supabase
    .from("restaurant_tables")
    .select("sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  // Size based on capacity, but shape is user's choice
  const w = data.capacity <= 2 ? 6 : data.capacity <= 4 ? 8 : data.capacity <= 6 ? 11 : 14;
  const h = data.shape === "circle" ? w : (data.capacity <= 4 ? 8 : 8);

  const id = randomUUID();
  await supabase.from("restaurant_tables").insert({
    id,
    business_id: businessId,
    name: data.name,
    zone: data.zone,
    capacity: data.capacity,
    shape: data.shape,
    pos_x: 50,
    pos_y: 50,
    width: w,
    height: h,
    sort_order: (maxOrder?.sort_order ?? 0) + 1,
  });
  revalidatePath(`/r/[slug]`, "layout");
  return { id, name: data.name, zone: data.zone, capacity: data.capacity, shape: data.shape, pos_x: 50, pos_y: 50, width: w, height: h, is_active: true, sort_order: (maxOrder?.sort_order ?? 0) + 1 };
}

export async function deleteTable(tableId: string) {
  await supabase.from("restaurant_tables").delete().eq("id", tableId);
  revalidatePath(`/r/[slug]`, "layout");
}

// ── Existing ──

export async function createBusiness(data: {
  name: string;
  slug: string;
  type?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  cuisine?: string;
  price_range?: string;
  about?: string;
}) {
  const id = randomUUID();
  await supabase.from("businesses").insert({ id, ...data });
  return { id };
}

export async function seedRestaurant(slug: string) {
  const id = randomUUID();

  await supabase.from("businesses").insert({
    id,
    name: "Chez Laurent",
    slug,
    type: "restaurant",
    address: "412 Oak Street",
    city: "Portland",
    state: "OR",
    zip: "97205",
    phone: "(503) 555-0142",
    email: "hello@chezlaurent.com",
    cuisine: "French-American",
    price_range: "$$$",
    about: "Seasonal French-American cooking in a warm, candlelit dining room. Chef Laurent sources from local farms and foragers to create menus that change with the seasons. Reservations recommended.",
    cover_image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80",
    booking_window_days: 30,
    min_party_size: 1,
    max_party_size: 8,
    slot_duration_minutes: 90,
  });

  // Hours: Tue-Sat dinner, closed Sun-Mon
  const hours = [
    { day: 0, closed: true },
    { day: 1, closed: true },
    { day: 2, open: "17:00", close: "22:00", last: "20:30" },
    { day: 3, open: "17:00", close: "22:00", last: "20:30" },
    { day: 4, open: "17:00", close: "22:00", last: "20:30" },
    { day: 5, open: "17:00", close: "23:00", last: "21:00" },
    { day: 6, open: "17:00", close: "23:00", last: "21:00" },
  ];

  for (const h of hours) {
    await supabase.from("business_hours").insert({
      id: randomUUID(),
      business_id: id,
      day_of_week: h.day,
      open_time: h.open ?? "00:00",
      close_time: h.close ?? "00:00",
      last_seating: h.last ?? null,
      is_closed: h.closed ?? false,
    });
  }

  // Table types (services)
  const tableTypes = [
    { name: "2-Top", capacity: 2, quantity: 4 },
    { name: "4-Top", capacity: 4, quantity: 6 },
    { name: "6-Top", capacity: 6, quantity: 2 },
    { name: "8-Top Private", capacity: 8, quantity: 1 },
  ];

  for (const [i, t] of tableTypes.entries()) {
    await supabase.from("services").insert({
      id: randomUUID(),
      business_id: id,
      name: t.name,
      capacity: t.capacity,
      quantity: t.quantity,
      duration_minutes: 90,
      price_cents: 0,
      sort_order: i,
    });
  }

  // Individual tables (physical inventory)
  const individualTables = [
    { name: "T1", zone: "Main", capacity: 2 },
    { name: "T2", zone: "Main", capacity: 2 },
    { name: "T3", zone: "Main", capacity: 4 },
    { name: "T4", zone: "Main", capacity: 4 },
    { name: "T5", zone: "Main", capacity: 4 },
    { name: "T6", zone: "Main", capacity: 6 },
    { name: "W1", zone: "Window", capacity: 2 },
    { name: "W2", zone: "Window", capacity: 4 },
    { name: "P1", zone: "Patio", capacity: 2 },
    { name: "P2", zone: "Patio", capacity: 4 },
    { name: "P3", zone: "Patio", capacity: 4 },
    { name: "P4", zone: "Patio", capacity: 6 },
    { name: "PDR", zone: "Private", capacity: 8 },
  ];

  for (const [i, t] of individualTables.entries()) {
    await supabase.from("restaurant_tables").insert({
      id: randomUUID(),
      business_id: id,
      name: t.name,
      zone: t.zone,
      capacity: t.capacity,
      sort_order: i,
    });
  }

  // Menu
  const menu = [
    { cat: "Starters", name: "French Onion Soup", desc: "Gruyère crouton, sherry broth", price: 1600, flags: [] },
    { cat: "Starters", name: "Burrata & Heirloom Tomato", desc: "Basil oil, flaky salt, grilled bread", price: 1800, flags: ["V", "GF"] },
    { cat: "Starters", name: "Duck Liver Mousse", desc: "Cornichons, mustard, toasted brioche", price: 1700, flags: [] },
    { cat: "Starters", name: "Roasted Beet Salad", desc: "Chèvre, candied walnuts, sherry vinaigrette", price: 1500, flags: ["V", "GF"] },
    { cat: "Mains", name: "Pan-Seared Salmon", desc: "Lentils du Puy, herb butter, haricots verts", price: 3400, flags: ["GF"] },
    { cat: "Mains", name: "Dry-Aged Ribeye", desc: "Pommes frites, maître d'hôtel butter, watercress", price: 4800, flags: ["GF"] },
    { cat: "Mains", name: "Roasted Half Chicken", desc: "Jus, mashed potatoes, seasonal vegetables", price: 2800, flags: ["GF"] },
    { cat: "Mains", name: "Wild Mushroom Risotto", desc: "Porcini, truffle oil, parmigiano", price: 2600, flags: ["V", "GF"] },
    { cat: "Mains", name: "Braised Lamb Shank", desc: "White beans, rosemary, gremolata", price: 3600, flags: ["GF"] },
    { cat: "Desserts", name: "Crème Brûlée", desc: "Tahitian vanilla", price: 1200, flags: ["V", "GF"] },
    { cat: "Desserts", name: "Chocolate Fondant", desc: "Crème anglaise, sea salt", price: 1400, flags: ["V"] },
    { cat: "Desserts", name: "Cheese Plate", desc: "Three selections, honeycomb, fruit", price: 1600, flags: ["V", "GF"] },
  ];

  for (const [i, item] of menu.entries()) {
    await supabase.from("menu_items").insert({
      id: randomUUID(),
      business_id: id,
      category: item.cat,
      name: item.name,
      description: item.desc,
      price_cents: item.price,
      dietary_flags: item.flags,
      sort_order: i,
    });
  }

  return { id, slug };
}
