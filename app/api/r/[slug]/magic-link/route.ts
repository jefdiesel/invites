import { requestMagicLink } from "@/lib/restaurant-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 });
  }

  const result = await requestMagicLink(slug, email);
  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
