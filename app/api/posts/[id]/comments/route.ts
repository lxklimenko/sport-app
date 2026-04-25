import { NextRequest } from "next/server";
import { getCommentsByPostId, createComment } from "@/lib/comments";
import { getUserById } from "@/lib/users";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);
  const { id } = await params;
  const comments = await getCommentsByPostId(id);
  return ok(comments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body?.text) return err("text обязателен");

  const { id } = await params;
  const user = await getUserById(userId);
  if (!user) return err("User not found", 404);

  const comment = await createComment({ postId: id, userId, authorName: user.name, text: body.text });
  return ok(comment, 201);
}
