"use server";

import { supabase } from "./db";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

type GuestSession = { email: string };

export async function getGuestSession(): Promise<GuestSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("guest_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GuestSession;
  } catch {
    return null;
  }
}

export async function setGuestSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set("guest_session", JSON.stringify({ email }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/my",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function requestGuestMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = email.toLowerCase().trim();

  // Check if this email has any bookings
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("email", normalized)
    .single();

  if (!client) {
    return { ok: false, error: "No reservations found for this email." };
  }

  // Generate token
  const token = randomUUID() + "-" + randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await supabase.from("guest_magic_links").insert({
    id: randomUUID(),
    email: normalized,
    token,
    expires_at: expiresAt.toISOString(),
  });

  // Send email
  const { sendGuestMagicLink } = await import("./email");
  await sendGuestMagicLink({ email: normalized, token });

  return { ok: true };
}

export async function verifyGuestToken(token: string): Promise<string | null> {
  const { data: link } = await supabase
    .from("guest_magic_links")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!link) return null;

  // Mark as used
  await supabase.from("guest_magic_links").update({
    used_at: new Date().toISOString(),
  }).eq("id", link.id);

  return link.email;
}
