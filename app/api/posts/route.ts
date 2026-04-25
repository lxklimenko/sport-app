import { NextRequest } from "next/server";
import { createPost } from "@/lib/posts";
import { getUserById } from "@/lib/users";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid JSON");

  const { workout, stats, imageUrl } = body;
  if (!workout || !stats) return err("workout и stats обязательны");

  const user = await getUserById(userId);
  if (!user) return err("User not found", 404);

  const post = await createPost({ userId, authorName: user.name, workout, stats, imageUrl: imageUrl ?? null, isMicroStep: false });
  return ok(post, 201);
}
