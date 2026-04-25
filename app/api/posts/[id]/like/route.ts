import { NextRequest } from "next/server";
import { toggleLike } from "@/lib/posts";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);
  const { id } = await params;
  const liked = await toggleLike(userId, id);
  return ok({ liked });
}
