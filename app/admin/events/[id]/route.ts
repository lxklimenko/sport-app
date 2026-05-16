import { NextRequest, NextResponse } from "next/server";
import { getEventById, updateEvent, deleteEvent } from "@/lib/events";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const event = await updateEvent(id, body);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (error: any) {
    if (error?.code === "23505" && error?.constraint === "season_events_slug_key") {
      return NextResponse.json(
        { error: `Событие с таким slug уже существует` },
        { status: 409 }
      );
    }
    console.error("Failed to update event:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении события" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteEvent(id);
  if (!deleted) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
