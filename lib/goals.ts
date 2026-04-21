import "server-only";

import { ensureUsersTable, getPool, hasDatabase } from "@/lib/db";

export type WeeklyGoal = {
  challengeId: string;
  challengeTitle: string;
  challengeEmoji: string;
  unitLabel: string;
  target: number;
  current: number;
  progress: number;
  weekStart: string;
};

let goalsTableReadyPromise: Promise<void> | null = null;

async function ensureGoalsTable() {
  if (!hasDatabase()) return;
  await ensureUsersTable();

  if (!goalsTableReadyPromise) {
    goalsTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS weekly_goals (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
          target_value INTEGER NOT NULL CHECK (target_value > 0),
          week_start DATE NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, challenge_id, week_start)
        )
      `)
      .then(() => undefined);
  }
  await goalsTableReadyPromise;
}

function getCurrentWeekStart(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - offset);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export async function setWeeklyGoal(
  userId: string,
  challengeId: string,
  targetValue: number
) {
  if (!hasDatabase()) throw new Error("Database required");
  if (targetValue <= 0) throw new Error("Цель должна быть больше 0");
  await ensureGoalsTable();

  const weekStart = getCurrentWeekStart();

  await getPool().query(
    `INSERT INTO weekly_goals (user_id, challenge_id, target_value, week_start)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, challenge_id, week_start) 
     DO UPDATE SET target_value = EXCLUDED.target_value`,
    [userId, challengeId, targetValue, weekStart]
  );
}

export async function getMyWeeklyGoals(userId: string): Promise<WeeklyGoal[]> {
  if (!hasDatabase()) return [];
  await ensureGoalsTable();

  const weekStart = getCurrentWeekStart();

  const result = await getPool().query<{
    challenge_id: string;
    challenge_title: string;
    challenge_emoji: string;
    unit_label: string;
    target_value: number;
    current_value: string;
  }>(
    `SELECT 
       g.challenge_id,
       c.title AS challenge_title,
       c.emoji AS challenge_emoji,
       COALESCE(c.unit_label, 'шагов') AS unit_label,
       g.target_value,
       COALESCE(SUM(se.steps), 0)::text AS current_value
     FROM weekly_goals g
     JOIN challenges c ON c.id = g.challenge_id
     LEFT JOIN step_entries se 
       ON se.user_id = g.user_id 
       AND se.challenge_id = g.challenge_id 
       AND se.entry_date >= g.week_start 
       AND se.entry_date < g.week_start + INTERVAL '7 days'
     WHERE g.user_id = $1 AND g.week_start = $2
     GROUP BY g.challenge_id, c.title, c.emoji, c.unit_label, g.target_value, g.week_start, g.created_at
     ORDER BY g.created_at DESC`,
    [userId, weekStart]
  );

  return result.rows.map(row => {
    const current = Number(row.current_value);
    const progress = Math.min(100, Math.round((current / row.target_value) * 100));
    return {
      challengeId: row.challenge_id,
      challengeTitle: row.challenge_title,
      challengeEmoji: row.challenge_emoji,
      unitLabel: row.unit_label,
      target: row.target_value,
      current,
      progress,
      weekStart,
    };
  });
}