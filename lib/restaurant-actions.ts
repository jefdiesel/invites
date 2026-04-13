"use server";

import { supabase } from "./db";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

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

  // Find best available table
  const { data: tables } = await supabase
    .from("services")
    .select("id, capacity, quantity")
    .eq("business_id", businessId)
    .eq("active", true)
    .gte("capacity", data.partySize)
    .order("capacity")
    .limit(1);

  const serviceId = tables?.[0]?.id ?? null;

  // Create booking
  const bookingId = randomUUID();
  await supabase.from("bookings").insert({
    id: bookingId,
    business_id: businessId,
    client_id: clientId,
    service_id: serviceId,
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

  // Tables
  const tables = [
    { name: "2-Top", capacity: 2, quantity: 4 },
    { name: "4-Top", capacity: 4, quantity: 6 },
    { name: "6-Top", capacity: 6, quantity: 2 },
    { name: "8-Top Private", capacity: 8, quantity: 1 },
  ];

  for (const [i, t] of tables.entries()) {
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
