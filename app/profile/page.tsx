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
      <main className="min-h-screen bg-bg-main text-text-primary pb-24">
        <ProfileHeader userName={user.name} />

        {/* Avatar + Stats */}
        <div className="px-5 pt-6">
          <div className="flex items-center gap-5 mb-5">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-[82px] h-[82px] rounded-full p-[2px] ${hasActiveChallenge ? "bg-gradient-to-br from-accent via-accent/60 to-transparent" : "bg-border-thin"}`}>
                <div className="w-full h-full rounded-full bg-bg-nested overflow-hidden">
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                </div>
              </div>
              {hasActiveChallenge && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent border-2 border-bg-main flex items-center justify-center">
                  <Flame className="w-2.5 h-2.5 text-black" fill="currentColor" />
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-3 text-center gap-1">
              {[
                { value: myPosts.length, label: "постов" },
                { value: followCounts.followers, label: "подписчиков" },
                { value: followCounts.following, label: "подписок" },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center">
                  <span className="text-[22px] font-bold tracking-tight leading-none">{stat.value}</span>
                  <span className="text-[10px] text-text-muted mt-1 leading-none">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Name + Bio */}
          <div className="mb-5">
            <p className="font-semibold text-base tracking-tight leading-snug">{user.name}</p>
            {(user.favoriteFormat || user.goal) && (
              <p className="text-sm text-text-muted mt-0.5">
                {user.favoriteFormat}{user.goal ? ` · 🎯 ${user.goal}` : ""}
              </p>
            )}
            {myTeam && (
              <Link href={`/teams/${myTeam.id}`} className="inline-flex items-center gap-1 mt-1.5 text-xs text-accent font-medium">
                {myTeam.emoji} {myTeam.name}
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-7">
            <Link
              href="/profile/edit"
              className="flex-1 bg-bg-nested py-2.5 rounded-xl text-sm font-semibold text-center active-scale"
            >
              Редактировать
            </Link>
            <Link
              href="/profile/stats"
              className="flex-1 bg-bg-nested py-2.5 rounded-xl text-sm font-semibold text-center active-scale"
            >
              Статистика
            </Link>
            <ShareButton userName={user.name} />
          </div>

          {/* Today's steps */}
          {todaySteps > 0 && (
            <div className="card-base px-4 py-3.5 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Сегодня</p>
                  <p className="text-sm font-semibold leading-tight">{todaySteps.toLocaleString()} шагов</p>
                </div>
              </div>
              <div className="text-accent text-xs font-semibold">Активен</div>
            </div>
          )}

          {/* Active Challenges */}
          {activeChallenges.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Челленджи</span>
                <span className="text-xs text-accent font-medium">{activeChallenges.length} активных</span>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
                {activeChallenges.map(my => (
                  <Link
                    key={my.challenge.id}
                    href={`/challenge/${my.challenge.id}`}
                    className="flex-shrink-0 card-base p-4 w-44 active-scale"
                  >
                    <div className="text-2xl mb-2">{my.challenge.emoji}</div>
                    <p className="text-sm font-semibold leading-snug mb-1 line-clamp-2">{my.challenge.title}</p>
                    <p className="text-xs text-accent font-medium">{my.totalSteps} {my.challenge.unitLabel}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Posts grid header */}
        <div className="flex items-center justify-between px-5 mb-3">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Grid3x3 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Публикации</span>
          </div>
          <span className="text-xs text-text-muted">{myPosts.length}</span>
        </div>

        {/* Posts Grid */}
        {myPosts.length === 0 ? (
          <div className="mx-5 card-base p-10 text-center">
            <p className="text-text-muted text-sm">Ещё нет публикаций</p>
            <Link href="/new-post" className="inline-flex items-center gap-1.5 mt-3 text-accent text-sm font-semibold">
              <Plus className="w-4 h-4" />
              Добавить тренировку
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[1.5px]">
            {myPosts.map(post => (
              <Link key={post.id} href={`/post/${post.id}`} className="aspect-square bg-bg-nested overflow-hidden active-scale">
                {post.imageUrl
                  ? <img src={post.imageUrl} className="w-full h-full object-cover" />
                  : (
                    <div className="w-full h-full flex items-center justify-center p-3">
                      <p className="text-[10px] text-text-muted text-center leading-relaxed line-clamp-4">{post.workout}</p>
                    </div>
                  )
                }
              </Link>
            ))}
          </div>
        )}

      </main>
    </ProfileClient>
  );
}
