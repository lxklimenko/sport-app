import { NextResponse } from "next/server";
import { migrateEvents, getLiveEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await migrateEvents();
    const events = await getLiveEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch live events:", error);
    return NextResponse.json([], { status: 500 });
  }
}
