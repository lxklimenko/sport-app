import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Plus, Grid3x3, List } from "lucide-react";

import { logout } from "@/app/actions/auth";
import { getSessionUserId } from "@/lib/auth";
import { getRecentPosts } from "@/lib/posts";
import { getUserById } from "@/lib/users";
import { getMyChallenges } from "@/lib/challenges";
import { getPool, hasDatabase } from "@/lib/db";
import { getFollowCounts } from "@/lib/follows";

export const dynamic = "force-dynamic";

async function getMyPostsWithStats(userId: string) {
  if (!hasDatabase()) return [];

  const result = await getPool().query<{
    id: string;
    workout: string;
    image_url: string | null;
    likes_count: string;
    comments_count: string;
  }>(
    `SELECT p.id, p.workout, p.image_url,
            COALESCE(l.cnt, 0)::text AS likes_count,
            COALESCE(c.cnt, 0)::text AS comments_count
     FROM posts p
     LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM likes GROUP BY post_id) l ON l.post_id = p.id
     LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM comments GROUP BY post_id) c ON c.post_id = p.id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return result.rows.map(row => ({
    id: row.id,
    workout: row.workout,
    imageUrl: row.image_url,
    likesCount: Number(row.likes_count),
    commentsCount: Number(row.comments_count),
  }));
}

async function getTodaySteps(userId: string) {
  if (!hasDatabase()) return 0;
  const result = await getPool().query<{ total: string }>(
    `SELECT COALESCE(SUM(steps), 0)::text AS total 
     FROM step_entries 
     WHERE user_id = $1 AND entry_date = CURRENT_DATE`,
    [userId]
  );
  return Number(result.rows[0]?.total ?? 0);
}

export default async function ProfilePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/signup");

  const user = await getUserById(userId);
  if (!user) redirect("/signup");

  const allChallenges = await getMyChallenges(userId, false);
  const activeChallenges = allChallenges.filter(c => c.challenge.isActive);
  const pastChallenges = allChallenges.filter(c => !c.challenge.isActive);

  const myPosts = await getMyPostsWithStats(userId);
  const todaySteps = await getTodaySteps(userId);
  const followCounts = await getFollowCounts(userId);

  const totalSteps = allChallenges.reduce((sum, c) => sum + c.totalSteps, 0);
  const bestRank = activeChallenges.length > 0
    ? Math.min(...activeChallenges.map(c => c.rank))
    : null;

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;

  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-20">

      <div className="sticky top-0 z-10 bg-[#0D0F12]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#1E1F22]" />
          <span className="font-semibold">{user.name}</span>
        </div>
        <div className="flex items-center gap-4 text-[#9AA0A6]">
          <Link href="/" className="hover:text-white transition">
            <Plus className="w-6 h-6" />
          </Link>
          <form action={logout}>
            <button className="hover:text-white transition">
              <Settings className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      <div className="px-4 pt-5">

        <div className="flex items-center gap-4 mb-4">
          <img
            src={avatarUrl}
            alt={user.name}
            className="w-20 h-20 rounded-full bg-[#1E1F22]"
          />

          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold">{myPosts.length}</div>
              <div className="text-xs text-[#9AA0A6]">постов</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{followCounts.followers}</div>
              <div className="text-xs text-[#9AA0A6]">подписчиков</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{followCounts.following}</div>
              <div className="text-xs text-[#9AA0A6]">подписок</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="font-semibold text-sm mb-0.5">{user.name}</div>
          <div className="text-sm text-[#C4C7C5]">
            {user.favoriteFormat}
            {user.goal && ` · 🎯 ${user.goal}`}
          </div>
          {todaySteps > 0 && (
            <div className="text-xs text-[#9AA0A6] mt-1">
              🔥 Сегодня: +{todaySteps.toLocaleString("ru-RU")}
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <Link
            href="/profile/edit"
            className="flex-1 bg-[#1E1F22] text-[#E3E3E3] py-2 px-4 rounded-xl text-sm font-medium hover:bg-[#2A2D33] transition text-center"
          >
            Редактировать
          </Link>
          <button className="flex-1 bg-[#1E1F22] text-[#E3E3E3] py-2 px-4 rounded-xl text-sm font-medium hover:bg-[#2A2D33] transition">
            Поделиться
          </button>
        </div>

        {(activeChallenges.length > 0 || pastChallenges.length > 0) && (
          <div className="mb-6">
            {activeChallenges.length > 0 && (
              <>
                <div className="text-xs text-[#9AA0A6] uppercase tracking-widest mb-3 px-1">
                  Сейчас
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {activeChallenges.map(my => {
                    const daysLeft = Math.max(
                      0,
                      Math.ceil((new Date(my.challenge.endDate).getTime() - Date.now()) / 86400000)
                    );
                    const progress = Math.min(
                      100,
                      Math.round(((my.challenge.days - daysLeft) / my.challenge.days) * 100)
                    );
                    return (
                      <Link
                        key={my.challenge.id}
                        href={`/challenge/${my.challenge.id}`}
                        className="bg-[#1E1F22] rounded-2xl p-3 relative hover:bg-[#2A2D33] transition"
                      >
                        <div className="absolute top-2 right-2 bg-[#FDE293] text-[#3D2A00] text-[10px] font-bold px-2 py-0.5 rounded-md">
                          #{my.rank}
                        </div>
                        <div className="text-xl mb-1">{my.challenge.emoji}</div>
                        <div className="text-xs font-semibold truncate pr-8">
                          {my.challenge.title}
                        </div>
                        <div className="text-[10px] text-[#9AA0A6] mt-0.5 truncate">
                          {my.totalSteps.toLocaleString("ru-RU")} {my.challenge.unitLabel}
                        </div>
                        <div className="mt-2 h-[2px] bg-[#2A2D33] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#A8C7FA]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {pastChallenges.length > 0 && (
              <>
                <div className="text-xs text-[#9AA0A6] uppercase tracking-widest mb-3 px-1">
                  История
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {pastChallenges.map(my => (
                    <Link
                      key={my.challenge.id}
                      href={`/challenge/${my.challenge.id}`}
                      className="bg-[#1E1F22] rounded-2xl p-3 relative hover:bg-[#2A2D33] transition opacity-70"
                    >
                      <div className="absolute top-2 right-2 bg-[#2A2D33] text-[#9AA0A6] text-[10px] font-bold px-2 py-0.5 rounded-md">
                        #{my.rank}
                      </div>
                      <div className="text-xl mb-1">{my.challenge.emoji}</div>
                      <div className="text-xs font-semibold truncate pr-8">
                        {my.challenge.title}
                      </div>
                      <div className="text-[10px] text-[#9AA0A6] mt-0.5">завершён</div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex border-t border-white/5">
        <button className="flex-1 py-3 flex items-center justify-center text-[#E3E3E3] border-t-2 border-[#A8C7FA] -mt-px">
          <Grid3x3 className="w-5 h-5" />
        </button>
        <button className="flex-1 py-3 flex items-center justify-center text-[#9AA0A6]">
          <List className="w-5 h-5" />
        </button>
      </div>

      {myPosts.length === 0 ? (
        <div className="text-center py-16 px-4 text-[#9AA0A6]">
          <div className="text-5xl mb-3">📸</div>
          <p className="font-semibold mb-1">Пока нет постов</p>
          <p className="text-sm">Опубликуй первую тренировку</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {myPosts.map(post => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="relative aspect-square bg-[#1E1F22] overflow-hidden group"
            >
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <p className="text-xs text-[#C4C7C5] line-clamp-4 text-center">
                    {post.workout}
                  </p>
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4 text-white text-sm font-semibold">
                <span>🔥 {post.likesCount}</span>
                <span>💬 {post.commentsCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

    </main>
  );
}