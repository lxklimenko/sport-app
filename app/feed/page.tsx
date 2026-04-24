import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getFollowingPosts } from "@/lib/posts";
import { getCommentsCountByPostIds } from "@/lib/comments";
import { getFollowCounts } from "@/lib/follows";
import { TopHeader } from "@/app/top-header";
import { FeedClient } from "./feed-client";
import { FeedPost } from "./feed-post";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const posts = await getFollowingPosts(userId);
  const postIds = posts.map(p => p.id);
  const commentsCounts = await getCommentsCountByPostIds(postIds);
  const followCounts = await getFollowCounts(userId);

  return (
    <FeedClient>
      <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-20">
        <TopHeader />

        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between sticky top-[60px] z-40 bg-[#0D0F12]/80 backdrop-blur-xl">
          <span className="font-semibold text-lg">Лента</span>
          <span className="text-xs text-[#9AA0A6]">
            {followCounts.following} {followCounts.following === 1 ? "подписка" : "подписок"}
          </span>
        </div>

        <div className="mx-auto max-w-2xl px-4">
          {followCounts.following === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-20 h-20 rounded-full bg-[#1E1F22] flex items-center justify-center mx-auto mb-5">
                <Users className="w-9 h-9 text-[#9AA0A6]" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Пока никого не подписан</h2>
              <p className="text-[#9AA0A6] text-sm mb-6">
                Подпишись на других участников чтобы видеть их тренировки в ленте
              </p>
              <Link
                href="/users"
                className="inline-flex items-center gap-2 rounded-full bg-[#A8C7FA] px-6 py-3 font-semibold text-[#062E6F] hover:bg-[#BBD6FE] transition text-sm"
              >
                Найти участников
              </Link>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="text-5xl mb-4">🤔</div>
              <h2 className="text-lg font-semibold mb-2">Пока тихо</h2>
              <p className="text-[#9AA0A6] text-sm">
                Те на кого ты подписан ещё не публиковали тренировки.<br />
                Напиши сам первым!
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {posts.map((post) => (
                <FeedPost
                  key={post.id}
                  post={post}
                  commentsCount={commentsCounts[post.id] ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </FeedClient>
  );
}