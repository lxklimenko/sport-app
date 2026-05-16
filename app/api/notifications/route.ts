import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getNotifications, getUnreadCount, migrateNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ notifications: [], unread: 0 });
  }

  await migrateNotifications();

  const [notifications, unread] = await Promise.all([
    getNotifications(session.userId, 20),
    getUnreadCount(session.userId),
  ]);

  return NextResponse.json({ notifications, unread });
}
