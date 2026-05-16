import { getPool } from "./db";

export type NotificationItem = {
  id: number;
  user_id: string;
  type: string;
  message: string;
  related_user_name: string | null;
  related_discipline: string | null;
  is_read: boolean;
  created_at: Date;
};

export async function migrateNotifications() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id                  BIGSERIAL PRIMARY KEY,
      user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type                TEXT NOT NULL,
      message             TEXT NOT NULL,
      related_user_name   TEXT,
      related_discipline  TEXT,
      is_read             BOOLEAN DEFAULT FALSE,
      created_at          TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON user_notifications (user_id, is_read, created_at DESC)
  `);
}

export async function getNotifications(
  userId: string,
  limit = 20
): Promise<NotificationItem[]> {
  const db = getPool();
  const { rows } = await db.query<NotificationItem>(
    `SELECT *
     FROM user_notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const db = getPool();
  const { rows } = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM user_notifications
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return parseInt(rows[0]?.count ?? "0", 10);
}

export async function markAsRead(
  userId: string,
  notificationId?: number
): Promise<void> {
  const db = getPool();
  if (notificationId) {
    await db.query(
      `UPDATE user_notifications SET is_read = TRUE
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  } else {
    await db.query(
      `UPDATE user_notifications SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
  }
}

// ─── Generators ───────────────────────────────────────────────────────────────

/**
 * Called after a user records an activity.
 * Checks if the user overtook someone and creates notifications.
 */
export async function generateOvertakeNotifications(
  userId: string,
  disciplineId: string,
  disciplineLabel: string
) {
  const db = getPool();

  // Get user's rank and total today
  const { rows: myRows } = await db.query<{ rank: string; total: string }>(
    `WITH ranked AS (
       SELECT
         ud.user_id,
         u.name,
         COALESCE(SUM(a.value), 0) AS total,
         ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.value), 0) DESC, ud.user_id) AS rank
       FROM user_disciplines ud
       JOIN users u ON u.id = ud.user_id
       LEFT JOIN activities a
         ON a.user_id = ud.user_id
         AND a.discipline_id = ud.discipline_id
         AND a.recorded_at::date = CURRENT_DATE
       WHERE ud.discipline_id = $1
       GROUP BY ud.user_id, u.name
     )
     SELECT rank::text, total::text FROM ranked WHERE user_id = $2`,
    [disciplineId, userId]
  );

  if (myRows.length === 0) return;
  const myRank = parseInt(myRows[0].rank, 10);
  const myTotal = parseFloat(myRows[0].total);

  // Find users who were ahead before this activity but are now behind
  // We check: users with rank just above us who have LESS total than us now
  const { rows: overtaken } = await db.query<{ user_id: string; name: string }>(
    `WITH ranked AS (
       SELECT
         ud.user_id,
         u.name,
         COALESCE(SUM(a.value), 0) AS total,
         ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.value), 0) DESC, ud.user_id) AS rank
       FROM user_disciplines ud
       JOIN users u ON u.id = ud.user_id
       LEFT JOIN activities a
         ON a.user_id = ud.user_id
         AND a.discipline_id = ud.discipline_id
         AND a.recorded_at::date = CURRENT_DATE
       WHERE ud.discipline_id = $1
       GROUP BY ud.user_id, u.name
     )
     SELECT r.user_id, r.name
     FROM ranked r
     WHERE r.rank < $2 AND r.total < $3
     ORDER BY r.rank DESC
     LIMIT 3`,
    [disciplineId, myRank, myTotal]
  );

  for (const victim of overtaken) {
    const shortName = victim.name.split(/\s+/)[0];

    // Create notification for the overtaken user
    await db.query(
      `INSERT INTO user_notifications (user_id, type, message, related_user_name, related_discipline)
       VALUES ($1, 'overtaken', $2, $3, $4)`,
      [
        victim.user_id,
        `${shortName} обогнал тебя в ${disciplineLabel}`,
        userId, // the one who overtook
        disciplineLabel,
      ]
    );

    // Also write to season feed
    await db.query(
      `INSERT INTO season_feed (type, user_name, discipline, message)
       VALUES ('overtake', $1, $2, $3)`,
      [
        shortName,
        disciplineLabel,
        `${shortName} обогнал соперника в ${disciplineLabel}`,
      ]
    );
  }
}

/**
 * Called when a user visits the season page.
 * Checks if the user is close to elimination and creates a danger notification.
 */
export async function generateDangerNotification(
  userId: string,
  disciplineId: string,
  disciplineLabel: string,
  target: number
) {
  const db = getPool();

  const { rows } = await db.query<{ total: string }>(
    `SELECT COALESCE(SUM(value), 0) AS total
     FROM activities
     WHERE user_id = $1 AND discipline_id = $2 AND recorded_at::date = CURRENT_DATE`,
    [userId, disciplineId]
  );

  const total = parseFloat(rows[0]?.total ?? "0");

  if (total === 0) {
    // Check if we already sent a danger notification today
    const { rows: existing } = await db.query(
      `SELECT 1 FROM user_notifications
       WHERE user_id = $1 AND type = 'danger'
         AND created_at::date = CURRENT_DATE
       LIMIT 1`,
      [userId]
    );
    if (existing.length === 0) {
      await db.query(
        `INSERT INTO user_notifications (user_id, type, message, related_discipline)
         VALUES ($1, 'danger', $2, $3)`,
        [
          userId,
          `Ты ещё ничего не записал в ${disciplineLabel} сегодня!`,
          disciplineLabel,
        ]
      );
    }
  } else if (total < target * 0.4) {
    const { rows: existing } = await db.query(
      `SELECT 1 FROM user_notifications
       WHERE user_id = $1 AND type = 'danger'
         AND created_at::date = CURRENT_DATE
       LIMIT 1`,
      [userId]
    );
    if (existing.length === 0) {
      const remaining = Math.round(target - total);
      await db.query(
        `INSERT INTO user_notifications (user_id, type, message, related_discipline)
         VALUES ($1, 'danger', $2, $3)`,
        [
          userId,
          `До вылета из ${disciplineLabel} осталось ${remaining.toLocaleString("ru")}!`,
          disciplineLabel,
        ]
      );
    }
  }
}

/**
 * Called when a user records an activity.
 * Checks if they entered top 10 and creates a milestone notification.
 */
export async function generateMilestoneNotification(
  userId: string,
  disciplineId: string,
  disciplineLabel: string
) {
  const db = getPool();

  const { rows } = await db.query<{ rank: string }>(
    `WITH ranked AS (
       SELECT ud.user_id, ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.value), 0) DESC, ud.user_id) AS rank
       FROM user_disciplines ud
       LEFT JOIN activities a
         ON a.user_id = ud.user_id
         AND a.discipline_id = ud.discipline_id
         AND a.recorded_at::date = CURRENT_DATE
       WHERE ud.discipline_id = $1
       GROUP BY ud.user_id
     )
     SELECT rank::text FROM ranked WHERE user_id = $2`,
    [disciplineId, userId]
  );

  if (rows.length === 0) return;
  const rank = parseInt(rows[0].rank, 10);

  if (rank <= 10) {
    // Check if we already notified about top 10 today
    const { rows: existing } = await db.query(
      `SELECT 1 FROM user_notifications
       WHERE user_id = $1 AND type = 'milestone'
         AND created_at::date = CURRENT_DATE
       LIMIT 1`,
      [userId]
    );
    if (existing.length === 0) {
      await db.query(
        `INSERT INTO user_notifications (user_id, type, message, related_discipline)
         VALUES ($1, 'milestone', $2, $3)`,
        [
          userId,
          `Ты в TOP ${rank} по ${disciplineLabel} сегодня!`,
          disciplineLabel,
        ]
      );
    }
  }
}
