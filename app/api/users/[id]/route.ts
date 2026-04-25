import { NextRequest } from "next/server";
import { getUserById } from "@/lib/users";
import { getFollowCounts, isFollowing } from "@/lib/follows";
import { getPool, hasDatabase } from "@/lib/db";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { id } = await params;
  const user = await getUserById(id);
  if (!user) return err("Not found", 404);

  const [followCounts, following, postsResult] = await Promise.all([
    getFollowCounts(id),
    isFollowing(userId, id),
    hasDatabase()
      ? getPool().query(`SELECT id, workout, image_url FROM posts WHERE user_id = $1 ORDER BY created_at DESC`, [id])
      : Promise.resolve({ rows: [] }),
  ]);

  return ok({
    user: { id: user.id, name: user.name, favoriteFormat: user.favoriteFormat, goal: user.goal },
    followCounts,
    isFollowing: following,
    posts: postsResult.rows,
  });
}
