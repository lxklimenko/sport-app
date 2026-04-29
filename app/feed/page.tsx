import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getRecentPosts } from "@/lib/posts";
import { getCommentsCountByPostIds } from "@/lib/comments";
import { getFollowCounts } from "@/lib/follows";
import { TopHeader } from "@/app/top-header";
import { FeedClient } from "./feed-client";
import { FeedPost } from "./feed-post";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  // Временно показываем все посты (общая лента)
  const posts = await getRecentPosts(50, userId);
  const postIds = posts.map(p => p.id);
  const commentsCounts = await getCommentsCountByPostIds(postIds);
  const followCounts = await getFollowCounts(userId);

  return (
    <FeedClient>
      <main className="min-h-screen bg-[#0D0F12] pb-20">
        <TopHeader />

        {/* Заголовок ленты */}
        <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between sticky top-[60px] z-40 bg-[#0D0F12]/80 backdrop-blur-xl">
          <span className="font-semibold text-xl text-white">Лента</span>
          <span className="text-xs text-[#98989E]">
            {followCounts.following} {followCounts.following === 1 ? "подписка" : "подписок"}
          </span>
        </div>

        <div className="mx-auto max-w-2xl px-4">
          {posts.length === 0 ? (
            /* Нет ни одного поста */
            <div className="text-center py-20 px-6">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5">
                <Users className="w-9 h-9 text-[#98989E]" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Пока нет постов</h2>
              <p className="text-[#98989E] text-sm mb-6">
                Будь первым — опубликуй свою тренировку!
              </p>
              <Link
                href="/new-post"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90 transition text-sm shadow-md"
              >
                Создать пост
              </Link>
            </div>
          ) : (
            /* Лента постов */
            <div className="space-y-5 py-5">
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