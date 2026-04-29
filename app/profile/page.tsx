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
      {/* Фоновые размытые пятна для глубины */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[128px]" />
      </div>

      <main className="relative min-h-screen bg-[#0D0F12] text-white pb-24">
        <ProfileHeader userName={user.name} />

        <div className="px-5 pt-6">
          {/* Аватар + панель статистики с пересечением */}
          <div className="relative flex items-start mb-8">
            {/* Аватар (выходит за границы) */}
            <div className="relative z-10 flex-shrink-0 -mr-6">
              <div
                className={`w-[90px] h-[90px] rounded-full p-[2px] ${
                  hasActiveChallenge
                    ? "bg-gradient-to-br from-accent via-accent/60 to-transparent"
                    : "bg-white/10"
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#1C1C1E] overflow-hidden">
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                </div>
              </div>
              {hasActiveChallenge && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent border-2 border-[#0D0F12] flex items-center justify-center">
                  <Flame className="w-2.5 h-2.5 text-black" fill="currentColor" />
                </div>
              )}
            </div>

            {/* Панель, наползающая на аватар */}
            <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-3xl p-4 pt-6 pl-8 shadow-2xl border border-white/10">
              {/* Три «стеклянные» карточки с разным наклоном */}
              <div className="flex gap-3 mb-3">
                <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-3 transform -rotate-2 shadow-lg">
                  <span className="text-lg font-bold">{myPosts.length}</span>
                  <span className="text-[9px] text-[#98989E] block">постов</span>
                </div>
                <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-3 transform rotate-1 shadow-lg">
                  <span className="text-lg font-bold">{followCounts.followers}</span>
                  <span className="text-[9px] text-[#98989E] block">подписчиков</span>
                </div>
                <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-3 transform -rotate-1 shadow-lg">
                  <span className="text-lg font-bold">{followCounts.following}</span>
                  <span className="text-[9px] text-[#98989E] block">подписок</span>
                </div>
              </div>

              {/* Имя и био */}
              <p className="font-semibold text-sm tracking-tight">{user.name}</p>
              {(user.favoriteFormat || user.goal) && (
                <p className="text-xs text-[#98989E] mt-0.5">
                  {user.favoriteFormat}
                  {user.goal ? ` · 🎯 ${user.goal}` : ""}
                </p>
              )}
              {myTeam && (
                <Link
                  href={`/teams/${myTeam.id}`}
                  className="inline-flex items-center gap-1 mt-1 text-xs text-accent font-medium"
                >
                  {myTeam.emoji} {myTeam.name}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Кнопки действий – лесенка */}
          <div className="flex flex-col items-start gap-2 mb-8 pl-2">
            {/* Основная кнопка */}
            <Link
              href="/profile/edit"
              className="bg-accent text-white text-xs font-semibold py-2.5 px-6 rounded-full shadow-lg shadow-accent/20 hover:shadow-accent/30 active:scale-95 transition-all"
            >
              Редактировать профиль
            </Link>
            {/* Вспомогательные ниже и правее */}
            <div className="flex gap-2 ml-4">
              <Link
                href="/profile/stats"
                className="bg-white/10 text-white text-xs font-semibold py-2.5 px-4 rounded-full hover:bg-white/20 active:scale-95 transition-all"
              >
                Статистика
              </Link>
              <ShareButton userName={user.name} />
            </div>
          </div>

          {/* Шаги сегодня */}
          {todaySteps > 0 && (
            <div className="glass p-3 flex items-center justify-between mb-6 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-[11px] text-[#98989E]">Сегодня</p>
                  <p className="text-sm font-semibold leading-tight">
                    {todaySteps.toLocaleString()} шагов
                  </p>
                </div>
              </div>
              <div className="text-accent text-[11px] font-semibold">Активен</div>
            </div>
          )}

          {/* Челленджи */}
          {activeChallenges.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-[#98989E] uppercase tracking-wider">
                  Челленджи
                </span>
                <span className="text-[11px] text-accent font-medium">
                  {activeChallenges.length} активных
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
                {activeChallenges.map(my => (
                  <Link
                    key={my.challenge.id}
                    href={`/challenge/${my.challenge.id}`}
                    className="flex-shrink-0 glass p-4 w-44 rounded-2xl active:scale-95 transition-transform"
                  >
                    <div className="text-2xl mb-2">{my.challenge.emoji}</div>
                    <p className="text-sm font-semibold leading-snug mb-1 line-clamp-2">
                      {my.challenge.title}
                    </p>
                    <p className="text-xs text-accent font-medium">
                      {my.totalSteps} {my.challenge.unitLabel}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Сетка постов с асимметрией */}
        <div className="flex items-center justify-between px-5 mb-3">
          <div className="flex items-center gap-1.5 text-[#98989E]">
            <Grid3x3 className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Публикации</span>
          </div>
          <span className="text-[11px] text-[#98989E]">{myPosts.length}</span>
        </div>

        {myPosts.length === 0 ? (
          <div className="mx-5 glass p-10 text-center rounded-2xl">
            <p className="text-[#98989E] text-xs">Ещё нет публикаций</p>
            <Link href="/new-post" className="inline-flex items-center gap-1.5 mt-3 text-accent text-xs font-semibold">
              <Plus className="w-4 h-4" />
              Добавить тренировку
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 px-5">
            {myPosts.map((post, index) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className={`aspect-square bg-[#1C1C1E] rounded-xl overflow-hidden active:scale-95 transition-transform ${
                  index % 3 === 1 ? '-mt-3' : index % 3 === 2 ? 'mt-2' : ''
                }`}
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