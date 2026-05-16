import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { migrateEvents, joinEvent, getEventById } from "@/lib/events";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await migrateEvents();

  const { eventId } = await request.json();
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const event = await getEventById(eventId);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const participant = await joinEvent(eventId, session.userId);

  return NextResponse.json({
    ok: true,
    event: event.title,
    participant,
  });
}
