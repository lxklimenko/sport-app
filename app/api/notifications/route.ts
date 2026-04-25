import { NextRequest } from "next/server";
import { getMyNotifications, markAllAsRead } from "@/lib/notifications";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);
  const notifications = await getMyNotifications(userId);
  return ok(notifications);
}

export async function POST(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);
  await markAllAsRead(userId);
  return ok({ ok: true });
}
