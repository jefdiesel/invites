import { supabase } from "@/lib/db";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const DEMO_RESTAURANTS = [
  {
    name: "Nori",
    slug: "nori",
    theme: "modern",
    type: "restaurant",
    cuisine: "Japanese",
    price_range: "$$$$",
    about: "Omakase counter dining. Twelve seats. One seating per night.",
    address: "88 Spring Street",
    city: "New York",
    state: "NY",
    zip: "10012",
    phone: "(212) 555-0188",
    email: "reservations@nori.nyc",
    cover_image_url: "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=1600&q=80",
    menu: [
      { cat: "Omakase", name: "Chef's Selection", desc: "12-course seasonal tasting", price: 22500, flags: [] },
      { cat: "Omakase", name: "Extended Omakase", desc: "18-course with rare cuts", price: 35000, flags: [] },
      { cat: "Drinks", name: "Sake Pairing", desc: "5 pours, curated by sommelier", price: 9500, flags: [] },
      { cat: "Drinks", name: "Non-Alcoholic Pairing", desc: "House-made teas and juices", price: 4500, flags: [] },
    ],
    hours: [
      { day: 0, closed: true }, { day: 1, closed: true },
      { day: 2, open: "18:00", close: "22:00", last: "18:00" },
      { day: 3, open: "18:00", close: "22:00", last: "18:00" },
      { day: 4, open: "18:00", close: "22:00", last: "18:00" },
      { day: 5, open: "18:00", close: "23:00", last: "18:00" },
      { day: 6, open: "18:00", close: "23:00", last: "18:00" },
    ],
  },
  {
    name: "The Copper Hen",
    slug: "copper-hen",
    theme: "rustic",
    type: "restaurant",
    cuisine: "Farm-to-Table",
    price_range: "$$",
    about: "Honest country cooking with ingredients from our own farm. Wood-fired oven, house-cured meats, vegetables picked this morning.",
    address: "Rural Route 7",
    city: "Hudson",
    state: "NY",
    zip: "12534",
    phone: "(518) 555-0234",
    email: "hello@copperhen.com",
    cover_image_url: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1600&q=80",
    menu: [
      { cat: "Garden", name: "Beet & Goat Cheese", desc: "Roasted beets, local chèvre, walnut vinaigrette", price: 1400, flags: ["V", "GF"] },
      { cat: "Garden", name: "Kale Caesar", desc: "Farm kale, sourdough croutons, anchovy dressing", price: 1200, flags: [] },
      { cat: "Hearth", name: "Wood-Fired Chicken", desc: "Half bird, herb butter, roasted roots", price: 2600, flags: ["GF"] },
      { cat: "Hearth", name: "Braised Pork Shoulder", desc: "Apple cider jus, mashed potatoes, braised greens", price: 2800, flags: ["GF"] },
      { cat: "Hearth", name: "Mushroom Pot Pie", desc: "Foraged mushrooms, thyme cream, puff pastry", price: 2200, flags: ["V"] },
      { cat: "Sweets", name: "Apple Brown Betty", desc: "Hudson Valley apples, oat crumble, vanilla cream", price: 1100, flags: ["V"] },
      { cat: "Sweets", name: "Chocolate Pudding", desc: "Dark chocolate, sea salt, whipped cream", price: 1000, flags: ["V", "GF"] },
    ],
    hours: [
      { day: 0, open: "10:00", close: "15:00", last: "14:00" },
      { day: 1, closed: true }, { day: 2, closed: true },
      { day: 3, open: "17:00", close: "21:00", last: "19:30" },
      { day: 4, open: "17:00", close: "21:00", last: "19:30" },
      { day: 5, open: "17:00", close: "22:00", last: "20:30" },
      { day: 6, open: "17:00", close: "22:00", last: "20:30" },
    ],
  },
  {
    name: "Benny's",
    slug: "bennys",
    theme: "playful",
    type: "restaurant",
    cuisine: "Burgers & Shakes",
    price_range: "$",
    about: "The best burgers in town. Smashed patties, hand-cut fries, thick shakes.",
    address: "1201 South Congress Ave",
    city: "Austin",
    state: "TX",
    zip: "78704",
    phone: "(512) 555-0099",
    email: "hey@bennys.fun",
    cover_image_url: "https://images.unsplash.com/photo-1466220549276-aef9ce186540?w=1600&q=80",
    menu: [
      { cat: "Burgers", name: "The Classic", desc: "Double smash patty, American cheese, pickle, onion, Benny's sauce", price: 1200, flags: [] },
      { cat: "Burgers", name: "Mushroom Swiss", desc: "Sautéed mushrooms, Swiss, garlic aioli", price: 1400, flags: [] },
      { cat: "Burgers", name: "The Impossible", desc: "Plant-based patty, all the fixings", price: 1500, flags: ["V"] },
      { cat: "Sides", name: "Hand-Cut Fries", desc: "Crispy, salty, perfect", price: 500, flags: ["V", "GF"] },
      { cat: "Sides", name: "Onion Rings", desc: "Beer-battered, ranch dip", price: 600, flags: ["V"] },
      { cat: "Shakes", name: "Vanilla Malt", desc: "Hand-spun, real vanilla bean", price: 800, flags: ["V"] },
      { cat: "Shakes", name: "Chocolate Peanut Butter", desc: "Thick enough to stand a spoon in", price: 900, flags: ["V"] },
    ],
    hours: [
      { day: 0, open: "11:00", close: "22:00", last: "21:30" },
      { day: 1, open: "11:00", close: "22:00", last: "21:30" },
      { day: 2, open: "11:00", close: "22:00", last: "21:30" },
      { day: 3, open: "11:00", close: "22:00", last: "21:30" },
      { day: 4, open: "11:00", close: "22:00", last: "21:30" },
      { day: 5, open: "11:00", close: "23:00", last: "22:30" },
      { day: 6, open: "11:00", close: "23:00", last: "22:30" },
    ],
  },
  {
    name: "Volta",
    slug: "volta",
    theme: "bright",
    type: "restaurant",
    cuisine: "New American",
    price_range: "$$$",
    about: "Bold flavors, local ingredients, natural wine. A neighborhood restaurant for people who love to eat.",
    address: "2847 Mission Street",
    city: "San Francisco",
    state: "CA",
    zip: "94110",
    phone: "(415) 555-0321",
    email: "eat@voltasf.com",
    cover_image_url: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1600&q=80",
    menu: [
      { cat: "Snacks", name: "Marinated Olives", desc: "Citrus, chili, herbs", price: 800, flags: ["V", "GF"] },
      { cat: "Snacks", name: "Burrata", desc: "Stone fruit, pistachios, aged balsamic", price: 1800, flags: ["V", "GF"] },
      { cat: "Plates", name: "Grilled Branzino", desc: "Salsa verde, charred lemon, fennel", price: 3200, flags: ["GF"] },
      { cat: "Plates", name: "Dry-Aged Duck Breast", desc: "Cherry gastrique, farro, delicata squash", price: 3400, flags: ["GF"] },
      { cat: "Plates", name: "Handmade Pappardelle", desc: "Wild boar ragu, pecorino, black pepper", price: 2800, flags: [] },
      { cat: "Sweet", name: "Olive Oil Cake", desc: "Meyer lemon curd, crème fraîche", price: 1200, flags: ["V"] },
    ],
    hours: [
      { day: 0, open: "17:00", close: "22:00", last: "20:30" },
      { day: 1, closed: true },
      { day: 2, open: "17:00", close: "22:00", last: "20:30" },
      { day: 3, open: "17:00", close: "22:00", last: "20:30" },
      { day: 4, open: "17:00", close: "23:00", last: "21:00" },
      { day: 5, open: "17:00", close: "23:00", last: "21:00" },
      { day: 6, open: "17:00", close: "23:00", last: "21:00" },
    ],
  },
];

export async function POST() {
  const results: string[] = [];

  for (const r of DEMO_RESTAURANTS) {
    // Check if already exists
    const { data: existing } = await supabase.from("businesses").select("id").eq("slug", r.slug).single();
    if (existing) {
      results.push(`${r.slug}: already exists, skipped`);
      continue;
    }

    const id = randomUUID();
    await supabase.from("businesses").insert({
      id, name: r.name, slug: r.slug, theme: r.theme, type: r.type,
      cuisine: r.cuisine, price_range: r.price_range, about: r.about,
      address: r.address, city: r.city, state: r.state, zip: r.zip,
      phone: r.phone, email: r.email, cover_image_url: r.cover_image_url,
      booking_window_days: 30, min_party_size: 1, max_party_size: 8, slot_duration_minutes: 90,
    });

    for (const h of r.hours) {
      await supabase.from("business_hours").insert({
        id: randomUUID(), business_id: id, day_of_week: h.day,
        open_time: (h as { open?: string }).open ?? "00:00",
        close_time: (h as { close?: string }).close ?? "00:00",
        last_seating: (h as { last?: string }).last ?? null,
        is_closed: (h as { closed?: boolean }).closed ?? false,
      });
    }

    for (const [i, item] of r.menu.entries()) {
      await supabase.from("menu_items").insert({
        id: randomUUID(), business_id: id, category: item.cat,
        name: item.name, description: item.desc, price_cents: item.price,
        dietary_flags: item.flags, sort_order: i,
      });
    }

    results.push(`${r.slug}: created (${r.theme} theme)`);
  }

  return NextResponse.json({ results });
}
