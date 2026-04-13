import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/storage";
import { supabase } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Verify business exists
  const { data: biz } = await supabase.from("businesses").select("id").eq("slug", slug).single();
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // TODO: verify auth cookie here for production

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const alt = formData.get("alt") as string | null;
  const caption = (formData.get("caption") as string) || "";
  const category = (formData.get("category") as string) || "gallery";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!alt?.trim()) return NextResponse.json({ error: "Alt text is required for accessibility" }, { status: 400 });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(biz.id, buffer, file.name, file.type);

    // Save to database
    const { data: maxOrder } = await supabase
      .from("business_photos")
      .select("sort_order")
      .eq("business_id", biz.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const photoId = randomUUID();
    await supabase.from("business_photos").insert({
      id: photoId,
      business_id: biz.id,
      url,
      alt: alt.trim(),
      caption,
      category,
      sort_order: (maxOrder?.sort_order ?? 0) + 1,
    });

    return NextResponse.json({ id: photoId, url, alt, caption, category });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
