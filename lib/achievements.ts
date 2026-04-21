import "server-only";

import { ensureUsersTable, getPool, hasDatabase } from "@/lib/db";

export type AchievementDef = {
  code: string;
  emoji: string;
  title: string;
  description: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { code: "first_steps", emoji: "🏁", title: "Первые шаги", description: "Первая запись в челлендже" },
  { code: "10k_in_day", emoji: "💪", title: "Боевой день", description: "10 000 за один день" },
  { code: "50k_total", emoji: "🔥", title: "Разгон", description: "50 000 суммарно" },
  { code: "100k_total", emoji: "⚡", title: "Спринтер", description: "100 000 суммарно" },
  { code: "500k_total", emoji: "👑", title: "Легенда", description: "500 000 суммарно" },

  { code: "streak_3", emoji: "🎯", title: "В ритме", description: "3 дня подряд" },
  { code: "streak_7", emoji: "🔥", title: "Неделя без срыва", description: "7 дней подряд" },
  { code: "streak_30", emoji: "⭐", title: "Железная дисциплина", description: "30 дней подряд" },

  { code: "first_post", emoji: "📸", title: "Первый пост", description: "Опубликовал первую тренировку" },
  { code: "10_followers", emoji: "👥", title: "Тренер", description: "10 подписчиков" },
  { code: "10_comments", emoji: "💬", title: "Душа команды", description: "10 написанных комментариев" },
  { code: "50_likes_received", emoji: "❤️", title: "Любимчик", description: "50 лайков на твои посты" },

  { code: "first_challenge", emoji: "🏆", title: "В игре", description: "Первый челлендж" },
  { code: "top_1", emoji: "🥇", title: "Чемпион", description: "Стал первым в челлендже" },
];

let achievementsTableReadyPromise: Promise<void> | null = null;

async function ensureAchievementsTable() {
  if (!hasDatabase()) return;
  await ensureUsersTable();

  if (!achievementsTableReadyPromise) {
    achievementsTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS achievements (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          code TEXT NOT NULL,
          unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, code)
        )
      `)
      .then(() => undefined);
  }
  await achievementsTableReadyPromise;
}

async function unlockIfNotAlready(userId: string, code: string) {
  await getPool().query(
    `INSERT INTO achievements (user_id, code) 
     VALUES ($1, $2) 
     ON CONFLICT (user_id, code) DO NOTHING`,
    [userId, code]
  );
}

export async function checkAndUnlockAchievements(userId: string) {
  if (!hasDatabase()) return;
  await ensureAchievementsTable();

  const entriesResult = await getPool().query<{
    total_entries: string;
    total_steps: string;
    max_daily: string;
  }>(
    `SELECT 
       COUNT(*)::text AS total_entries,
       COALESCE(SUM(steps), 0)::text AS total_steps,
       COALESCE(MAX(steps), 0)::text AS max_daily
     FROM step_entries WHERE user_id = $1`,
    [userId]
  );
  const entriesData = entriesResult.rows[0];
  const totalEntries = Number(entriesData?.total_entries ?? 0);
  const totalSteps = Number(entriesData?.total_steps ?? 0);
  const maxDaily = Number(entriesData?.max_daily ?? 0);

  if (totalEntries >= 1) await unlockIfNotAlready(userId, "first_steps");
  if (maxDaily >= 10000) await unlockIfNotAlready(userId, "10k_in_day");
  if (totalSteps >= 50000) await unlockIfNotAlready(userId, "50k_total");
  if (totalSteps >= 100000) await unlockIfNotAlready(userId, "100k_total");
  if (totalSteps >= 500000) await unlockIfNotAlready(userId, "500k_total");

  const datesResult = await getPool().query<{ entry_date: Date }>(
    `SELECT DISTINCT entry_date FROM step_entries WHERE user_id = $1 ORDER BY entry_date DESC`,
    [userId]
  );
  const dates = datesResult.rows.map(r => {
    const d = new Date(r.entry_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  let bestStreak = 0;
  if (dates.length > 0) {
    let streak = 1;
    let best = 1;
    for (let i = 1; i < dates.length; i++) {
      if (dates[i - 1] - dates[i] === 86400000) {
        streak++;
        if (streak > best) best = streak;
      } else {
        streak = 1;
      }
    }
    bestStreak = best;
  }
  if (bestStreak >= 3) await unlockIfNotAlready(userId, "streak_3");
  if (bestStreak >= 7) await unlockIfNotAlready(userId, "streak_7");
  if (bestStreak >= 30) await unlockIfNotAlready(userId, "streak_30");

  const postsResult = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM posts WHERE user_id = $1`,
    [userId]
  );
  if (Number(postsResult.rows[0]?.count ?? 0) >= 1) {
    await unlockIfNotAlready(userId, "first_post");
  }

  const followersResult = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM follows WHERE following_id = $1`,
    [userId]
  );
  if (Number(followersResult.rows[0]?.count ?? 0) >= 10) {
    await unlockIfNotAlready(userId, "10_followers");
  }

  const commentsResult = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM comments WHERE user_id = $1`,
    [userId]
  );
  if (Number(commentsResult.rows[0]?.count ?? 0) >= 10) {
    await unlockIfNotAlready(userId, "10_comments");
  }

  const likesResult = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count 
     FROM likes l 
     JOIN posts p ON p.id = l.post_id 
     WHERE p.user_id = $1`,
    [userId]
  );
  if (Number(likesResult.rows[0]?.count ?? 0) >= 50) {
    await unlockIfNotAlready(userId, "50_likes_received");
  }

  const participantsResult = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM participants WHERE user_id = $1`,
    [userId]
  );
  if (Number(participantsResult.rows[0]?.count ?? 0) >= 1) {
    await unlockIfNotAlready(userId, "first_challenge");
  }

  const top1Result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count 
     FROM participants p1 
     WHERE p1.user_id = $1 AND p1.total_steps > 0
       AND NOT EXISTS (
         SELECT 1 FROM participants p2 
         WHERE p2.challenge_id = p1.challenge_id 
           AND p2.total_steps > p1.total_steps
       )`,
    [userId]
  );
  if (Number(top1Result.rows[0]?.count ?? 0) >= 1) {
    await unlockIfNotAlready(userId, "top_1");
  }
}

export async function getUserAchievements(userId: string): Promise<{ code: string; unlockedAt: string }[]> {
  if (!hasDatabase()) return [];
  await ensureAchievementsTable();

  const result = await getPool().query<{ code: string; unlocked_at: Date }>(
    `SELECT code, unlocked_at FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC`,
    [userId]
  );

  return result.rows.map(r => ({
    code: r.code,
    unlockedAt: r.unlocked_at.toISOString(),
  }));
}