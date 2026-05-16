import { getPool } from "./db";
import { getDisciplineLabel } from "./disciplines";

export type SurvivalState = {
  user_id: string;
  discipline_id: string;
  is_alive: boolean;
  survived_days: number;
  current_streak: number;
  longest_streak: number;
  last_survived_date: string | null;
  eliminated_at: Date | null;
};

export async function migrateSurvival() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_survival (
      user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      discipline_id     TEXT NOT NULL,
      is_alive          BOOLEAN DEFAULT TRUE,
      survived_days     INTEGER DEFAULT 0,
      current_streak    INTEGER DEFAULT 0,
      longest_streak    INTEGER DEFAULT 0,
      last_survived_date DATE,
      eliminated_at     TIMESTAMPTZ,
      PRIMARY KEY (user_id, discipline_id)
    )
  `);
}

export async function getSurvival(
  userId: string,
  disciplineId: string
): Promise<SurvivalState | null> {
  const db = getPool();
  const { rows } = await db.query<SurvivalState>(
    `SELECT * FROM user_survival WHERE user_id = $1 AND discipline_id = $2`,
    [userId, disciplineId]
  );
  return rows[0] ?? null;
}

export async function getSurvivalForUser(
  userId: string
): Promise<SurvivalState[]> {
  const db = getPool();
  const { rows } = await db.query<SurvivalState>(
    `SELECT * FROM user_survival WHERE user_id = $1 ORDER BY discipline_id`,
    [userId]
  );
  return rows;
}

// ─── Daily Reset ──────────────────────────────────────────────────────────────

const DISCIPLINE_TARGETS: Record<string, number> = {
  steps:   10_000,
  running: 5,
  burpees: 50,
};

type ResetResult = {
  survived: number;
  eliminated: number;
  total: number;
  events: string[];
};

/**
 * Runs the daily reset for ALL users in ALL disciplines.
 * Called by cron at midnight.
 */
export async function runDailyReset(): Promise<ResetResult> {
  const db = getPool();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Get all enrolled users
  const { rows: enrolled } = await db.query<{
    user_id: string;
    discipline_id: string;
    name: string;
  }>(
    `SELECT ud.user_id, ud.discipline_id, u.name
     FROM user_disciplines ud
     JOIN users u ON u.id = ud.user_id`
  );

  let survived = 0;
  let eliminated = 0;
  const events: string[] = [];

  for (const row of enrolled) {
    const target = DISCIPLINE_TARGETS[row.discipline_id];
    if (!target) continue;

    const disciplineLabel = getDisciplineLabel(row.discipline_id);
    const shortName = row.name.split(/\s+/)[0];

    // Get yesterday's total
    const { rows: activityRows } = await db.query<{ total: string }>(
      `SELECT COALESCE(SUM(value), 0) AS total
       FROM activities
       WHERE user_id = $1 AND discipline_id = $2 AND recorded_at::date = $3`,
      [row.user_id, row.discipline_id, yesterdayStr]
    );

    const total = parseFloat(activityRows[0]?.total ?? "0");
    const metTarget = total >= target;

    // Get or create survival record
    const existing = await db.query<SurvivalState>(
      `SELECT * FROM user_survival WHERE user_id = $1 AND discipline_id = $2`,
      [row.user_id, row.discipline_id]
    );

    if (existing.rows.length === 0) {
      // First time — create record
      await db.query(
        `INSERT INTO user_survival (user_id, discipline_id, is_alive, survived_days, current_streak, longest_streak, last_survived_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          row.user_id,
          row.discipline_id,
          metTarget,
          metTarget ? 1 : 0,
          metTarget ? 1 : 0,
          metTarget ? 1 : 0,
          metTarget ? yesterdayStr : null,
        ]
      );

      if (metTarget) {
        survived++;
        events.push(
          `${shortName} пережил первый день в ${disciplineLabel}`
        );
      } else {
        eliminated++;
        events.push(
          `${shortName} не выполнил норму в ${disciplineLabel} в первый же день`
        );
      }
    } else {
      const s = existing.rows[0];

      if (metTarget) {
        const newStreak = s.current_streak + 1;
        const newLongest = Math.max(s.longest_streak, newStreak);
        await db.query(
          `UPDATE user_survival
           SET is_alive = TRUE,
               survived_days = survived_days + 1,
               current_streak = $1,
               longest_streak = $2,
               last_survived_date = $3,
               eliminated_at = NULL
           WHERE user_id = $4 AND discipline_id = $5`,
          [newStreak, newLongest, yesterdayStr, row.user_id, row.discipline_id]
        );
        survived++;

        if (newStreak === 1) {
          events.push(
            `${shortName} вернулся в ${disciplineLabel} после вылета`
          );
        } else {
          events.push(
            `${shortName} пережил ${newStreak} ${newStreak < 5 ? "дня" : "дней"} подряд в ${disciplineLabel}`
          );
        }
      } else {
        // Eliminated
        await db.query(
          `UPDATE user_survival
           SET is_alive = FALSE,
               current_streak = 0,
               eliminated_at = NOW()
           WHERE user_id = $1 AND discipline_id = $2`,
          [row.user_id, row.discipline_id]
        );
        eliminated++;

        if (s.is_alive) {
          events.push(
            `${shortName} вылетел из ${disciplineLabel} — не выполнил норму`
          );
        }
      }
    }
  }

  // Write events to season_feed (batch insert)
  if (events.length > 0) {
    // Insert in batches of 50 to avoid huge queries
    for (let i = 0; i < events.length; i += 50) {
      const batch = events.slice(i, i + 50);
      const params: string[] = [];
      const placeholders: string[] = [];

      batch.forEach((msg, j) => {
        const type = msg.includes("вылетел") ? "elimination" : "survival";
        const idx = j * 2;
        placeholders.push(`($${idx + 1}, NULL, NULL, NULL, $${idx + 2}, NOW())`);
        params.push(type, msg);
      });

      await db.query(
        `INSERT INTO season_feed (type, user_name, discipline, value, message, created_at)
         VALUES ${placeholders.join(",")}`,
        params
      );
    }
  }

  return { survived, eliminated, total: enrolled.length, events };
}
