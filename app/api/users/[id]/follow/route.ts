import { NextRequest } from "next/server";
import { toggleFollow } from "@/lib/follows";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);
  const { id } = await params;
  if (id === userId) return err("Нельзя подписаться на себя");
  const following = await toggleFollow(userId, id);
  return ok({ following });
}
