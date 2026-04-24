import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Plus, Grid3x3, List } from "lucide-react";

import { logout } from "@/app/actions/auth";
import { getSessionUserId } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { getMyChallenges } from "@/lib/challenges";
import { getPool, hasDatabase } from "@/lib/db";
import { getFollowCounts } from "@/lib/follows";
import { getMyTeam } from "@/lib/teams";
import { ProfileHeader } from "./profile-header";
import { ProfileClient } from "./profile-client";
import { ShareButton } from "./share-button";

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
  const pastChallenges = allChallenges.filter(c => !c.challenge.isActive);

  const myPosts = await getMyPostsWithStats(userId);
  const todaySteps = await getTodaySteps(userId);
  const followCounts = await getFollowCounts(userId);
  const myTeam = await getMyTeam(userId);

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;

  return (
    <ProfileClient>
      <main className="min-h-screen bg-bg-main text-text-primary pb-24">

        {/* ИСПОЛЬЗУЕМ НОВУЮ ШАПКУ */}
        <ProfileHeader userName={user.name} />

        <div className="px-5 pt-6">
          <div className="flex items-center gap-6 mb-8">
            <img
              src={avatarUrl}
              alt={user.name}
              className="w-24 h-24 rounded-full bg-[#141415] border border-border-thin shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] p-1.5"
            />
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-2xl font-bold">{myPosts.length}</div>
                <div className="text-[10px] uppercase text-text-muted mt-1">постов</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{followCounts.followers}</div>
                <div className="text-[10px] uppercase text-text-muted mt-1">подписчиков</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{followCounts.following}</div>
                <div className="text-[10px] uppercase text-text-muted mt-1">подписок</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xl font-bold mb-1">{user.name}</div>
            <div className="text-sm text-text-secondary">
              {user.favoriteFormat} {user.goal && ` · 🎯 ${user.goal}`}
            </div>
          </div>

          <div className="flex gap-2 mb-8">
            <Link href="/profile/edit" className="flex-1 bg-[#1E1F22] py-2 rounded-xl text-sm font-medium text-center">Редактировать</Link>
            <Link href="/profile/stats" className="flex-1 bg-[#1E1F22] py-2 rounded-xl text-sm font-medium text-center">Статистика</Link>
            <ShareButton userName={user.name} />
          </div>

          {activeChallenges.length > 0 && (
            <div className="mb-8">
              <div className="text-[11px] uppercase text-text-muted mb-4 font-medium">Активные челленджи</div>
              <div className="grid grid-cols-2 gap-3">
                {activeChallenges.map(my => (
                  <Link key={my.challenge.id} href={`/challenge/${my.challenge.id}`} className="card-base p-4 relative">
                    <div className="text-sm font-bold text-text-primary">{my.challenge.title}</div>
                    <div className="text-[10px] text-text-muted mt-1">{my.totalSteps} {my.challenge.unitLabel}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-[2px]">
          {myPosts.map(post => (
            <Link key={post.id} href={`/post/${post.id}`} className="aspect-square bg-[#141415] overflow-hidden">
              {post.imageUrl && <img src={post.imageUrl} className="w-full h-full object-cover" />}
            </Link>
          ))}
        </div>
      </main>
    </ProfileClient>
  );
}