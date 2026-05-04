import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Grid3x3, ChevronRight, Flame } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { getMyChallenges } from "@/lib/challenges";
import { getPool, hasDatabase } from "@/lib/db";
import { getFollowCounts } from "@/lib/follows";
import { getMyTeam } from "@/lib/teams";
import { ProfileClient } from "./profile-client";
import { ShareButton } from "./share-button";
import { ProfileHeader } from "./profile-header";

export const dynamic = "force-dynamic";

async function getMyPostsWithStats(userId: string) {
  if (!hasDatabase()) return [];
  const result = await getPool().query<{
    id: string;
    workout: string;
    image_url: string | null;
    is_micro_step: boolean;
    likes_count: string;
    comments_count: string;
  }>(
    `SELECT p.id, p.workout, p.image_url, p.is_micro_step,
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
    isMicroStep: row.is_micro_step,
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

  const myPosts = await getMyPostsWithStats(userId);
  const todaySteps = await getTodaySteps(userId);
  const followCounts = await getFollowCounts(userId);
  const myTeam = await getMyTeam(userId);

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;
  const hasActiveChallenge = activeChallenges.length > 0;

  return (
    <ProfileClient>
      <main className="min-h-screen bg-[#0D0F12] text-white pb-24">
        <ProfileHeader userName={user.name} />

        <div className="px-5 pt-6">
          {/* Аватар + статистика – строго, без рамок */}
          <div className="flex items-center gap-5 mb-5">
            {/* Аватар – простой круг */}
            <div className="relative flex-shrink-0">
              <div className="w-[82px] h-[82px] rounded-full bg-[#1C1C1E] overflow-hidden">
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              </div>
              {hasActiveChallenge && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent border-2 border-[#0D0F12] flex items-center justify-center">
                  <Flame className="w-2.5 h-2.5 text-black" fill="currentColor" />
                </div>
              )}
            </div>

            {/* Числа с подписями */}
            <div className="flex-1 grid grid-cols-3 text-center">
              {[
                { value: myPosts.length, label: "постов" },
                { value: followCounts.followers, label: "подписчиков" },
                { value: followCounts.following, label: "подписок" },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center">
                  <span className="text-lg font-bold">{stat.value}</span>
                  <span className="text-[11px] text-[#98989E]">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Имя и био */}
          <div className="mb-5">
            <p className="font-semibold text-sm">{user.name}</p>
            {(user.favoriteFormat || user.goal) && (
              <p className="text-xs text-[#98989E] mt-0.5">
                {user.favoriteFormat}
                {user.goal ? ` · 🎯 ${user.goal}` : ""}
              </p>
            )}
            {myTeam && (
              <Link
                href={`/teams/${myTeam.id}`}
                className="inline-flex items-center gap-1 mt-1.5 text-xs text-accent font-medium"
              >
                {myTeam.emoji} {myTeam.name}
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Кнопки действий – простой ряд */}
          <div className="flex gap-2 mb-7">
            <Link
              href="/profile/edit"
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-center bg-accent text-black active:scale-95 transition-transform"
            >
              Редактировать
            </Link>
            <Link
              href="/profile/stats"
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-center bg-white/10 text-white hover:bg-white/20 transition active:scale-95"
            >
              Статистика
            </Link>
            <div className="flex-1">
              <ShareButton userName={user.name} />
            </div>
          </div>

          {/* Шаги сегодня (если есть) – компактно */}
          {todaySteps > 0 && (
            <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl bg-white/5">
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[11px] text-[#98989E]">Сегодня</p>
                <p className="text-sm font-semibold">
                  {todaySteps.toLocaleString()} шагов
                </p>
              </div>
            </div>
          )}

          {/* Челленджи – строгий список вместо скролла */}
          {activeChallenges.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-semibold text-[#98989E] uppercase tracking-wider mb-3">
                Челленджи
              </p>
              <div className="space-y-2">
                {activeChallenges.map(my => (
                  <Link
                    key={my.challenge.id}
                    href={`/challenge/${my.challenge.id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{my.challenge.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{my.challenge.title}</p>
                        <p className="text-xs text-[#98989E]">
                          {my.totalSteps} {my.challenge.unitLabel}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#98989E]" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Публикации – сетка без сдвигов */}
        <div className="flex items-center justify-between px-5 mb-3">
          <div className="flex items-center gap-1.5 text-[#98989E]">
            <Grid3x3 className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Публикации</span>
          </div>
          <span className="text-[11px] text-[#98989E]">{myPosts.length}</span>
        </div>

        {myPosts.length === 0 ? (
          <div className="mx-5 bg-white/5 rounded-2xl p-10 text-center">
            <p className="text-[#98989E] text-xs">Ещё нет публикаций</p>
            <Link href="/new-post" className="inline-flex items-center gap-1.5 mt-3 text-accent text-xs font-semibold">
              <Plus className="w-4 h-4" />
              Добавить тренировку
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 px-5">
            {myPosts.map(post => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="aspect-square bg-[#1C1C1E] rounded-lg overflow-hidden active:scale-95 transition-transform"
              >
                {post.imageUrl ? (
                  <img src={post.imageUrl?.startsWith("/") ? `https://alex-cosh.ru${post.imageUrl}` : post.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <p className="text-[10px] text-[#98989E] text-center leading-relaxed line-clamp-4">{post.workout}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </ProfileClient>
  );
}