import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Grid3x3, List } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getUserById, getUserStreak, getActivityHeatmap, getWeeklyProgress } from "@/lib/users";
import { getMyChallenges } from "@/lib/challenges";
import { getPool, hasDatabase } from "@/lib/db";
import { isFollowing, getFollowCounts } from "@/lib/follows";
import { toggleFollowAction } from "@/app/actions";
import { StreakBadge } from "@/app/profile/streak-badge";
import { ActivityHeatmap } from "@/app/profile/heatmap";
import { WeeklyChart } from "@/app/profile/weekly-chart";
import { AchievementsBadges } from "@/app/profile/achievements";
import { getUserAchievements } from "@/lib/achievements";

export const dynamic = "force-dynamic";

async function getUserPostsWithStats(userId: string) {
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

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUserId = await getSessionUserId();

  if (currentUserId === id) {
    redirect("/profile");
  }

  const user = await getUserById(id);
  if (!user) notFound();

  const allChallenges = await getMyChallenges(id, false);
  const activeChallenges = allChallenges.filter(c => c.challenge.isActive);
  const pastChallenges = allChallenges.filter(c => !c.challenge.isActive);

  const posts = await getUserPostsWithStats(id);
  const following = currentUserId ? await isFollowing(currentUserId, id) : false;
  const followCounts = await getFollowCounts(id);
  const streak = await getUserStreak(id);
  const heatmap = await getActivityHeatmap(id);
  const weeklyProgress = await getWeeklyProgress(id);
  const achievements = await getUserAchievements(id);

  const totalSteps = allChallenges.reduce((sum, c) => sum + c.totalSteps, 0);
  const bestRank = activeChallenges.length > 0
    ? Math.min(...activeChallenges.map(c => c.rank))
    : null;

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;

  return (
    <main className="min-h-screen bg-bg-main text-text-primary pb-24">

      {/* Верхняя шапка с премиальным стеклом */}
      <div className="sticky top-0 z-50 glass-panel px-5 py-4 flex items-center gap-3">
        <Link
          href="/profile"
          className="p-2 -ml-2 hover:bg-bg-hover rounded-full transition-colors active-scale"
        >
          <ArrowLeft className="w-6 h-6 text-text-primary drop-shadow-sm" />
        </Link>
        <span className="font-bold text-lg tracking-tight drop-shadow-sm">{user.name}</span>
      </div>

      <div className="px-5 pt-6">

        {/* Профиль и статистика */}
        <div className="flex items-center gap-6 mb-8">
          {/* Аватарка в виде вдавленной лунки */}
          <img
            src={avatarUrl}
            alt={user.name}
            className="w-24 h-24 rounded-full bg-[#141415] border border-border-thin shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] p-1.5"
          />

          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <div className="group">
              <div className="text-2xl font-bold tracking-[-0.5px] drop-shadow-sm group-hover:text-accent transition-colors">{posts.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-text-muted mt-1 font-medium">постов</div>
            </div>
            <div className="group">
              <div className="text-2xl font-bold tracking-[-0.5px] drop-shadow-sm group-hover:text-accent transition-colors">{followCounts.followers}</div>
              <div className="text-[10px] uppercase tracking-widest text-text-muted mt-1 font-medium">подписчиков</div>
            </div>
            <div className="group">
              <div className="text-2xl font-bold tracking-[-0.5px] drop-shadow-sm group-hover:text-accent transition-colors">{followCounts.following}</div>
              <div className="text-[10px] uppercase tracking-widest text-text-muted mt-1 font-medium">подписок</div>
            </div>
          </div>
        </div>

        {/* Информация пользователя */}
        <div className="mb-6">
          <div className="text-xl font-bold tracking-[-0.5px] mb-1">{user.name}</div>
          <div className="text-sm text-text-secondary font-medium">
            {user.favoriteFormat}
            {user.goal && ` · 🎯 ${user.goal}`}
          </div>
        </div>

        {/* Блоки статистики */}
        <div className="flex flex-col gap-4 mb-6">
          <StreakBadge
            current={streak.current}
            best={streak.best}
            weekDays={streak.weekDays}
          />
          <ActivityHeatmap data={heatmap} />
          <WeeklyChart weeks={weeklyProgress.weeks} />
          <AchievementsBadges unlocked={achievements} />
        </div>

        {/* Кнопки действий с физичным объёмом */}
        <div className="flex gap-3 mb-8">
          <form action={toggleFollowAction} className="flex-1">
             <input type="hidden" name="userId" value={id} />
             <button 
                type="submit"
                className={`w-full py-3 px-4 rounded-[1.25rem] text-sm font-bold active-scale transition-all ${
                  following 
                    ? "bg-bg-nested border border-border-thin shadow-[0_2px_6px_-2px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] text-text-primary hover:bg-bg-hover" 
                    : "bg-accent text-text-on-accent shadow-[0_2px_8px_-2px_rgba(50,215,75,0.4),inset_0_1px_0_0_rgba(255,255,255,0.4)] hover:bg-accent-hover"
                }`}
              >
                {following ? "Отписаться" : "Подписаться"}
              </button>
          </form>
          <Link
            href={`/chat/${user.id}`}
            className="flex-1 bg-bg-nested border border-border-thin shadow-[0_2px_6px_-2px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] text-text-primary py-3 px-4 rounded-[1.25rem] text-sm font-bold active-scale hover:bg-bg-hover transition-all text-center"
          >
            Сообщение
          </Link>
        </div>

        {/* Челленджи */}
        {(activeChallenges.length > 0 || pastChallenges.length > 0) && (
          <div className="mb-8">
            {activeChallenges.length > 0 && (
              <>
                <div className="text-[11px] uppercase tracking-widest text-text-muted mb-4 px-1 font-medium">
                  Сейчас
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
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
                        className="card-base p-4 relative group"
                      >
                        {/* Ранг вдавленный */}
                        <div className="absolute top-3 right-3 bg-bg-main border border-border-thin text-text-primary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                          #{my.rank}
                        </div>
                        
                        <div className="w-10 h-10 rounded-[1rem] bg-bg-main border border-border-thin shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center mb-3">
                          <span className="text-xl drop-shadow-sm">{my.challenge.emoji}</span>
                        </div>
                        
                        <div className="text-sm font-bold leading-tight pr-6 mb-1 text-text-primary group-hover:text-accent transition-colors">
                          {my.challenge.title}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-text-muted truncate font-medium">
                          {my.totalSteps.toLocaleString("ru-RU")} {my.challenge.unitLabel}
                        </div>
                        
                        {/* Неоновый прогресс-бар */}
                        <div className="mt-4 h-1.5 bg-[#141415] rounded-full overflow-hidden border border-border-thin shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                          <div
                            className="h-full rounded-full bg-accent shadow-[0_0_8px_rgba(50,215,75,0.5),inset_0_1px_0_0_rgba(255,255,255,0.4)] transition-all duration-500 ease-out relative"
                            style={{ width: `${progress}%` }}
                          >
                             {progress > 0 && progress < 100 && (
                                <div className="absolute top-0 bottom-0 right-0 w-2 bg-white/40 blur-[2px] rounded-full" />
                             )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {pastChallenges.length > 0 && (
              <>
                <div className="text-[11px] uppercase tracking-widest text-text-muted mb-4 px-1 font-medium">
                  История
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {pastChallenges.map(my => (
                    <Link
                      key={my.challenge.id}
                      href={`/challenge/${my.challenge.id}`}
                      className="bg-[#141415] border border-border-thin shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)] rounded-[1.5rem] p-4 relative opacity-70 hover:opacity-100 transition-opacity active-scale"
                    >
                      <div className="absolute top-3 right-3 bg-bg-main border border-border-thin text-[10px] font-bold text-text-muted px-2 py-0.5 rounded-full">
                        #{my.rank}
                      </div>
                      
                      <div className="w-10 h-10 rounded-[1rem] bg-bg-main border border-border-thin shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] flex items-center justify-center mb-3">
                        <span className="text-xl grayscale">{my.challenge.emoji}</span>
                      </div>
                      
                      <div className="text-sm font-bold leading-tight pr-6 text-text-secondary mb-1">
                        {my.challenge.title}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-text-muted font-medium">
                        завершён
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Табы постов */}
      <div className="flex border-t border-border-thin bg-[#141415]">
        <button className="flex-1 py-4 flex items-center justify-center text-accent border-t-[3px] border-accent -mt-[2px] shadow-[0_-2px_8px_-2px_rgba(50,215,75,0.3)] active-scale">
          <Grid3x3 className="w-5 h-5" />
        </button>
        <button className="flex-1 py-4 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors border-t-[3px] border-transparent -mt-[2px] active-scale">
          <List className="w-5 h-5" />
        </button>
      </div>

      {/* Сетка постов */}
      {posts.length === 0 ? (
        <div className="text-center py-20 px-4 text-text-muted">
          <div className="text-5xl mb-4 grayscale opacity-50 drop-shadow-md">📸</div>
          <p className="font-bold text-text-primary mb-1">Пока нет постов</p>
          <p className="text-sm font-medium">Пользователь ещё не публиковал тренировки</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[2px] bg-bg-main">
          {posts.map(post => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="relative aspect-square bg-[#141415] overflow-hidden group"
            >
              {post.imageUrl ? (
                <img
                  src={post.imageUrl?.startsWith("/") ? `https://alex-cosh.ru${post.imageUrl}` : post.imageUrl}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                  <p className="text-[10px] text-text-secondary line-clamp-4 text-center font-mono leading-relaxed">
                    {post.workout}
                  </p>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-bg-main/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 text-text-primary text-sm font-bold">
                <div className="flex items-center gap-1.5 drop-shadow-sm">
                  <span className="text-accent">🔥</span> {post.likesCount}
                </div>
                <div className="flex items-center gap-1.5 drop-shadow-sm">
                  <span className="text-text-secondary">💬</span> {post.commentsCount}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </main>
  );
}