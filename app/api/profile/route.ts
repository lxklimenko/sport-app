import { NextRequest } from "next/server";
import { getUserById, updateUserProfile, getUserStreak } from "@/lib/users";
import { getMyChallenges } from "@/lib/challenges";
import { getFollowCounts } from "@/lib/follows";
import { getMyTeam } from "@/lib/teams";
import { getUserAchievements } from "@/lib/achievements";
import { getPool, hasDatabase } from "@/lib/db";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const user = await getUserById(userId);
  if (!user) return err("Not found", 404);

  const [challenges, followCounts, myTeam, achievements, streak, postsResult, todayResult] = await Promise.all([
    getMyChallenges(userId, false),
    getFollowCounts(userId),
    getMyTeam(userId),
    getUserAchievements(userId),
    getUserStreak(userId),
    hasDatabase()
      ? getPool().query(
          `SELECT p.id, p.workout, p.image_url, p.is_micro_step,
                  COALESCE(l.cnt,0)::text AS likes_count,
                  COALESCE(c.cnt,0)::text AS comments_count
           FROM posts p
           LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM likes GROUP BY post_id) l ON l.post_id = p.id
           LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM comments GROUP BY post_id) c ON c.post_id = p.id
           WHERE p.user_id = $1 ORDER BY p.created_at DESC`, [userId])
      : Promise.resolve({ rows: [] }),
    hasDatabase()
      ? getPool().query(`SELECT COALESCE(SUM(steps),0)::text AS total FROM step_entries WHERE user_id=$1 AND entry_date=CURRENT_DATE`, [userId])
      : Promise.resolve({ rows: [{ total: "0" }] }),
  ]);

  return ok({
    user: { id: user.id, name: user.name, email: user.email, favoriteFormat: user.favoriteFormat, goal: user.goal },
    followCounts,
    myTeam,
    achievements,
    streak,
    activeChallenges: challenges.filter(c => c.challenge.isActive),
    pastChallenges: challenges.filter(c => !c.challenge.isActive),
    posts: postsResult.rows.map(r => ({
      id: r.id, workout: r.workout, imageUrl: r.image_url,
      isMicroStep: r.is_micro_step, likesCount: Number(r.likes_count), commentsCount: Number(r.comments_count),
    })),
    todaySteps: Number(todayResult.rows[0]?.total ?? 0),
  });
}

export async function PATCH(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid JSON");

  await updateUserProfile(userId, { name: body.name, favoriteFormat: body.favoriteFormat, goal: body.goal });
  return ok({ updated: true });
}
