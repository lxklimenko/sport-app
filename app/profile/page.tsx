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
import { getMyTeam } from "@/lib/teams";

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
  const myTeam = await getMyTeam(userId);

  // Строгий аватар
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;

  return (
    <main className="min-h-screen bg-bg-main text-text-primary pb-24">

      {/* Верхняя шапка с премиальным размытием */}
      <div className="sticky top-0 z-50 glass-panel px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(50,215,75,0.6)]" />
          <span className="font-bold tracking-tight">{user.name}</span>
        </div>
        <div className="flex items-center gap-5 text-text-primary">
          <Link href="/" className="hover:text-accent transition-colors active-scale">
            <Plus className="w-6 h-6" />
          </Link>
          <form action={logout}>
            <button className="hover:text-accent transition-colors active-scale">
              <Settings className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      <div className="px-5 pt-6">

        {/* Профиль и статистика */}
        <div className="flex items-center gap-6 mb-8">
          {/* Аватарка в виде вдавленной стеклянной лунки */}
          <img
            src={avatarUrl}
            alt={user.name}
            className="w-24 h-24 rounded-full bg-[#141415] border border-border-thin shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] p-1.5"
          />

          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <div className="group">
              <div className="text-2xl font-bold tracking-[-0.5px] drop-shadow-sm group-hover:text-accent transition-colors">{myPosts.length}</div>
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

          {todaySteps > 0 && (
            <div className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-[#141415] border border-border-thin shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
              <span className="text-[11px] uppercase tracking-widest text-text-muted mr-2 font-medium">Сегодня:</span>
              <span className="text-sm font-bold text-accent drop-shadow-[0_0_4px_rgba(50,215,75,0.3)]">+{todaySteps.toLocaleString("ru-RU")}</span>
            </div>
          )}
        </div>

        {/* Команда */}
        <div className="mb-6">
          {myTeam ? (
            <Link
              href={`/teams/${myTeam.id}`}
              className="card-base flex items-center gap-4 p-4 group"
            >
              <div className="w-12 h-12 rounded-[1rem] bg-bg-main border border-border-thin shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center text-2xl shrink-0">
                {myTeam.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1 font-medium">Команда</div>
                <div className="font-bold text-base truncate group-hover:text-accent transition-colors">{myTeam.name}</div>
              </div>
              <div className="text-[11px] uppercase tracking-widest text-text-secondary shrink-0 font-mono font-medium">
                {myTeam.memberCount} чел.
              </div>
            </Link>
          ) : (
            <Link
              href="/teams"
              className="card-base border-dashed flex items-center gap-4 p-4 opacity-70 hover:opacity-100 transition-opacity active-scale"
            >
              <div className="w-12 h-12 rounded-[1rem] bg-bg-main shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center text-2xl text-text-muted shrink-0">
                +
              </div>
              <div className="flex-1">
                <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1 font-medium">Команда</div>
                <div className="font-bold text-base text-text-secondary">Выбрать или создать</div>
              </div>
            </Link>
          )}
        </div>

        {/* Кнопки действий: Редактировать / Статистика / Поделиться */}
        <div className="flex gap-2 mb-8">
          <Link
            href="/profile/edit"
            className="flex-1 bg-[#1E1F22] text-[#E3E3E3] py-2 px-4 rounded-xl text-sm font-medium hover:bg-[#2A2D33] transition text-center"
          >
            Редактировать
          </Link>
          <Link
            href="/profile/stats"
            className="flex-1 bg-[#1E1F22] text-[#E3E3E3] py-2 px-4 rounded-xl text-sm font-medium hover:bg-[#2A2D33] transition text-center"
          >
            Статистика
          </Link>
          <button className="flex-1 bg-[#1E1F22] text-[#E3E3E3] py-2 px-4 rounded-xl text-sm font-medium hover:bg-[#2A2D33] transition">
            Поделиться
          </button>
        </div>

        {/* Челленджи */}
        {(activeChallenges.length > 0 || pastChallenges.length > 0) && (
          <div className="mb-8">
            {activeChallenges.length > 0 && (
              <>
                <div className="text-[11px] uppercase tracking-widest text-text-muted mb-4 px-1 font-medium">
                  Активные челленджи
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
                        {/* Ранг */}
                        <div className="absolute top-3 right-3 bg-bg-main border border-border-thin text-text-primary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                          #{my.rank}
                        </div>

                        {/* Иконка вдавленная в карточку */}
                        <div className="w-10 h-10 rounded-[1rem] bg-bg-main border border-border-thin shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center mb-3">
                          <span className="text-xl drop-shadow-sm">{my.challenge.emoji}</span>
                        </div>

                        <div className="text-sm font-bold leading-tight pr-6 mb-1 text-text-primary group-hover:text-accent transition-colors">
                          {my.challenge.title}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-text-muted truncate font-medium">
                          {my.totalSteps.toLocaleString("ru-RU")} {my.challenge.unitLabel}
                        </div>

                        {/* Прогресс-бар с неоновым свечением */}
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
                        <div className="mt-2 flex justify-between text-[11px] font-bold">
                          <span className="text-accent drop-shadow-[0_0_2px_rgba(50,215,75,0.3)]">{progress}%</span>
                          <span className="text-text-secondary">{daysLeft} дн</span>
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
                        Завершён
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
      {myPosts.length === 0 ? (
        <div className="text-center py-20 px-4 text-text-muted">
          <div className="text-5xl mb-4 grayscale opacity-50 drop-shadow-md">📸</div>
          <p className="font-bold text-text-primary mb-1">Пока нет постов</p>
          <p className="text-sm font-medium">Опубликуй первую тренировку</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[2px] bg-bg-main">
          {myPosts.map(post => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="relative aspect-square bg-[#141415] overflow-hidden group"
            >
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
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