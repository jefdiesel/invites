import { seedRestaurant } from "@/lib/restaurant-actions";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await seedRestaurant("chez-laurent");
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
