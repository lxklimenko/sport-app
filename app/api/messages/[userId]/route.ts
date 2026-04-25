import { NextRequest } from "next/server";
import { getDialog, sendMessage, markDialogAsRead } from "@/lib/messages";
import { getUserById } from "@/lib/users";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const myId = await getApiUserId(req);
  if (!myId) return err("Unauthorized", 401);
  const { userId } = await params;
  await markDialogAsRead(myId, userId);
  const messages = await getDialog(myId, userId);
  return ok(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const myId = await getApiUserId(req);
  if (!myId) return err("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body?.text) return err("text обязателен");

  const { userId } = await params;
  const me = await getUserById(myId);
  if (!me) return err("User not found", 404);

  const message = await sendMessage({ senderId: myId, receiverId: userId, text: body.text });
  return ok(message, 201);
}
