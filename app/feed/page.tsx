import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame, MessageCircle, Users } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getFollowingPosts } from "@/lib/posts";
import { getCommentsCountByPostIds } from "@/lib/comments";
import { getFollowCounts } from "@/lib/follows";
import { toggleLikeAction } from "@/app/actions";
import { TopHeader } from "@/app/top-header";

export const dynamic = "force-dynamic";

function formatTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

export default async function FeedPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const posts = await getFollowingPosts(userId);
  const postIds = posts.map(p => p.id);
  const commentsCounts = await getCommentsCountByPostIds(postIds);
  const followCounts = await getFollowCounts(userId);

  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-20">
      <TopHeader />

      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
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
              <div key={post.id} className="bg-[#1E1F22] rounded-3xl overflow-hidden">
                <div className="p-5 pb-3">
                  <div className="flex justify-between items-center text-sm">
                    <Link
                      href={`/user/${post.userId}`}
                      className="font-semibold hover:text-[#A8C7FA] transition"
                    >
                      {post.authorName}
                    </Link>
                    <span className="text-[#9AA0A6] text-xs">
                      {formatTime(post.createdAt)}
                    </span>
                  </div>

                  <p className="mt-3 text-lg leading-relaxed">{post.workout}</p>
                  <p className="mt-1 text-sm text-[#C4C7C5]">{post.stats}</p>
                </div>

                {post.imageUrl && (
                  <Link href={`/post/${post.id}`}>
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-full max-h-[500px] object-cover"
                    />
                  </Link>
                )}

                <div className="p-5 pt-3 flex gap-5 text-[#9AA0A6]">
                  <form action={toggleLikeAction}>
                    <input type="hidden" name="postId" value={post.id} />
                    <button
                      type="submit"
                      className={`flex items-center gap-1.5 text-sm transition ${
                        post.likedByMe ? "text-[#FFB4AB]" : "hover:text-white"
                      }`}
                    >
                      <Flame
                        className="w-4 h-4"
                        fill={post.likedByMe ? "currentColor" : "none"}
                      />
                      <span>{post.likesCount}</span>
                    </button>
                  </form>

                  <Link
                    href={`/post/${post.id}`}
                    className="flex items-center gap-1.5 text-sm hover:text-white transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{commentsCounts[post.id] ?? 0}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}