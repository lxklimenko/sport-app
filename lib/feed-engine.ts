import { getPool } from "./db";

/**
 * Generates atmospheric feed events to make the season feel alive.
 * Call this periodically (e.g. every 5 minutes via a cron job or on page request).
 */
export async function generateAtmosphericEvents() {
  const db = getPool();

  // ── 1. Danger: count users at risk today ──────────────────────────────
  const { rows: riskRows } = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM user_disciplines ud
     WHERE NOT EXISTS (
       SELECT 1 FROM activities a
       WHERE a.user_id = ud.user_id
         AND a.discipline_id = ud.discipline_id
         AND a.recorded_at::date = CURRENT_DATE
     )`
  );
  const atRisk = parseInt(riskRows[0]?.count ?? "0", 10);

  if (atRisk > 0) {
    // Check if we already have a similar danger event today
    const { rows: existing } = await db.query(
      `SELECT 1 FROM season_feed
       WHERE type = 'danger'
         AND created_at::date = CURRENT_DATE
       LIMIT 1`
    );
    if (existing.length === 0) {
      await db.query(
        `INSERT INTO season_feed (type, message)
         VALUES ($1, $2)`,
        [
          "danger",
          `${atRisk.toLocaleString("ru")} ${atRisk === 1 ? "участник" : "участников"} ещё ничего не записали сегодня`,
        ]
      );
    }
  }

  // ── 2. Survival: count users who have been active today ───────────────
  const { rows: survivalRows } = await db.query<{ count: string }>(
    `SELECT COUNT(DISTINCT a.user_id) AS count
     FROM activities a
     WHERE a.recorded_at::date = CURRENT_DATE`
  );
  const survivors = parseInt(survivalRows[0]?.count ?? "0", 10);

  if (survivors > 0) {
    const { rows: existing } = await db.query(
      `SELECT 1 FROM season_feed
       WHERE type = 'survival'
         AND created_at::date = CURRENT_DATE
       LIMIT 1`
    );
    if (existing.length === 0) {
      await db.query(
        `INSERT INTO season_feed (type, message)
         VALUES ($1, $2)`,
        [
          "survival",
          `${survivors.toLocaleString("ru")} ${survivors === 1 ? "человек" : "человек"} уже записали активность сегодня`,
        ]
      );
    }
  }

  // ── 3. Join: count total enrolled users ───────────────────────────────
  const { rows: joinRows } = await db.query<{ count: string }>(
    `SELECT COUNT(DISTINCT user_id) AS count FROM user_disciplines`
  );
  const totalPlayers = parseInt(joinRows[0]?.count ?? "0", 10);

  if (totalPlayers > 0) {
    const { rows: existing } = await db.query(
      `SELECT 1 FROM season_feed
       WHERE type = 'join'
         AND created_at::date = CURRENT_DATE
       LIMIT 1`
    );
    if (existing.length === 0) {
      await db.query(
        `INSERT INTO season_feed (type, message)
         VALUES ($1, $2)`,
        [
          "join",
          `${totalPlayers.toLocaleString("ru")} игроков в сезоне — каждый день решает`,
        ]
      );
    }
  }
}
