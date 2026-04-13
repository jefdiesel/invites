import { loginWithPassword } from "@/lib/restaurant-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ role: null, error: "Password required" }, { status: 400 });
  }

  const { role } = await loginWithPassword(slug, password);

  if (!role) {
    return NextResponse.json({ role: null, error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ role });

  // Set session cookie — httpOnly, scoped to this restaurant's path
  res.cookies.set(`session_${slug}`, JSON.stringify({ role, slug }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/r/${slug}`,
    maxAge: 60 * 60 * 12, // 12 hours — covers a full shift
  });

  return res;
}
