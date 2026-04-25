import { NextRequest } from "next/server";
import { getRecentPosts, getFollowingPosts } from "@/lib/posts";
import { getCommentsCountByPostIds } from "@/lib/comments";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const type = req.nextUrl.searchParams.get("type") ?? "following";
  const posts = type === "following"
    ? await getFollowingPosts(userId)
    : await getRecentPosts(userId);

  const ids = posts.map(p => p.id);
  const commentCounts = ids.length ? await getCommentsCountByPostIds(ids) : {};

  const result = posts.map(p => ({
    ...p,
    commentsCount: commentCounts[p.id] ?? 0,
  }));

  return ok(result);
}
