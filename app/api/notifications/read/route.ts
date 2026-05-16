import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { markAsRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const notificationId = body.id ? Number(body.id) : undefined;

  await markAsRead(session.userId, notificationId);

  return NextResponse.json({ ok: true });
}
