import { NextResponse } from "next/server";
import { migrateEvents, getAllEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await migrateEvents();
    const events = await getAllEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json([], { status: 500 });
  }
}
