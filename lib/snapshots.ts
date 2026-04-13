"use server";

import { supabase } from "./db";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

// Take a snapshot of the current state before making changes
export async function takeSnapshot(businessId: string, type: string, label: string) {
  const data: Record<string, unknown> = {};

  if (type === "full" || type === "settings") {
    const { data: biz } = await supabase.from("businesses").select("*").eq("id", businessId).single();
    data.settings = biz;
  }

  if (type === "full" || type === "menu") {
    const { data: menu } = await supabase.from("menu_items").select("*").eq("business_id", businessId).order("sort_order");
    data.menu = menu;
  }

  if (type === "full" || type === "hours") {
    const { data: hours } = await supabase.from("business_hours").select("*").eq("business_id", businessId).order("day_of_week");
    data.hours = hours;
  }

  if (type === "full" || type === "photos") {
    const { data: photos } = await supabase.from("business_photos").select("*").eq("business_id", businessId).order("sort_order");
    data.photos = photos;
  }

  await supabase.from("business_snapshots").insert({
    id: randomUUID(),
    business_id: businessId,
    snapshot_type: type,
    data,
    label,
  });
}

// List snapshots for a business
export async function listSnapshots(businessId: string, limit = 20) {
  const { data } = await supabase
    .from("business_snapshots")
    .select("id, snapshot_type, label, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// Restore from a snapshot
export async function restoreSnapshot(snapshotId: string) {
  const { data: snapshot } = await supabase
    .from("business_snapshots")
    .select("*")
    .eq("id", snapshotId)
    .single();

  if (!snapshot) throw new Error("Snapshot not found");

  const businessId = snapshot.business_id;
  const data = snapshot.data as Record<string, unknown>;

  // Take a snapshot of current state BEFORE restoring (so you can undo the undo)
  await takeSnapshot(businessId, "full", `Before rollback to ${new Date(snapshot.created_at).toLocaleString()}`);

  // Restore settings
  if (data.settings) {
    const settings = data.settings as Record<string, unknown>;
    // Only restore content fields, not auth or system fields
    const { id, created_at, staff_password, admin_password, custom_domain, ...restoreFields } = settings;
    await supabase.from("businesses").update(restoreFields).eq("id", businessId);
  }

  // Restore menu
  if (data.menu) {
    const menu = data.menu as Array<Record<string, unknown>>;
    await supabase.from("menu_items").delete().eq("business_id", businessId);
    if (menu.length > 0) {
      await supabase.from("menu_items").insert(menu);
    }
  }

  // Restore hours
  if (data.hours) {
    const hours = data.hours as Array<Record<string, unknown>>;
    await supabase.from("business_hours").delete().eq("business_id", businessId);
    if (hours.length > 0) {
      await supabase.from("business_hours").insert(hours);
    }
  }

  // Restore photos (DB records only — R2 images are immutable)
  if (data.photos) {
    const photos = data.photos as Array<Record<string, unknown>>;
    await supabase.from("business_photos").delete().eq("business_id", businessId);
    if (photos.length > 0) {
      await supabase.from("business_photos").insert(photos);
    }
  }

  revalidatePath(`/r/[slug]`, "layout");
}

// Clean up old snapshots (keep last 30 days)
export async function cleanOldSnapshots(businessId: string) {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("business_snapshots")
    .delete()
    .eq("business_id", businessId)
    .lt("created_at", cutoff);
}
