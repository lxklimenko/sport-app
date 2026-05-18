import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPool } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({
      userId: null,
      name: null,
      inSeason: false,
      joinedIds: [],
      survival: { total_survived: 0, current_streak: 0, alive_disciplines: 0 },
      todayValue: 0,
      todayTarget: 10000,
      danger: "safe",
      userRank: null,
      totalPlayers: 0,
      rivalsBeaten: 0,
      rivalName: null,
      stepsToRival: null,
      hoursAway: null,
      lastSeenAt: null,
    });
  }

  const db = getPool();

  const [disciplinesRes, survivalRes, todayRes, rivalsRes, lastSeenRes] = await Promise.all([
    db.query<{ discipline_id: string }>(
      "SELECT discipline_id FROM user_disciplines WHERE user_id = $1 ORDER BY joined_at",
      [session.userId]
    ),
    db.query(
      `SELECT
         COALESCE(SUM(survived_days), 0)::int AS total_survived,
         COALESCE(MAX(current_streak), 0)::int AS current_streak,
         COALESCE(SUM(CASE WHEN is_alive = true THEN 1 ELSE 0 END), 0)::int AS alive_disciplines
       FROM user_survival
       WHERE user_id = $1`,
      [session.userId]
    ),
    db.query<{ total: string }>(
      `SELECT COALESCE(SUM(value), 0) AS total
       FROM activities
       WHERE user_id = $1 AND discipline_id = 'steps' AND recorded_at::date = CURRENT_DATE`,
      [session.userId]
    ),
    db.query(
      `SELECT COUNT(*)::int AS beaten
       FROM (
         SELECT ud.user_id,
           COALESCE(SUM(a.value), 0) AS my_total
         FROM user_disciplines ud
         LEFT JOIN activities a ON a.user_id = ud.user_id AND a.discipline_id = ud.discipline_id AND a.recorded_at::date = CURRENT_DATE
         WHERE ud.discipline_id IN (SELECT discipline_id FROM user_disciplines WHERE user_id = $1)
         GROUP BY ud.user_id
       ) me
       JOIN (
         SELECT ud.user_id,
           COALESCE(SUM(a.value), 0) AS their_total
         FROM user_disciplines ud
         LEFT JOIN activities a ON a.user_id = ud.user_id AND a.discipline_id = ud.discipline_id AND a.recorded_at::date = CURRENT_DATE
         WHERE ud.discipline_id IN (SELECT discipline_id FROM user_disciplines WHERE user_id = $1)
         GROUP BY ud.user_id
       ) them ON them.user_id != $1
       WHERE me.user_id = $1 AND them.their_total < me.my_total`,
      [session.userId]
    ),
    // Last activity time
    db.query<{ last_seen: string }>(
      `SELECT MAX(recorded_at)::text AS last_seen
       FROM activities
       WHERE user_id = $1`,
      [session.userId]
    ),
  ]);

  const joinedIds = disciplinesRes.rows.map((r) => r.discipline_id);
  const inSeason = joinedIds.length > 0;
  const survival = survivalRes.rows[0] ?? { total_survived: 0, current_streak: 0, alive_disciplines: 0 };
  const todayValue = parseFloat(todayRes.rows[0]?.total ?? "0");
  const todayTarget = 10000;
  const rivalsBeaten = parseInt(rivalsRes.rows[0]?.beaten ?? "0", 10);
  const lastSeenAt = lastSeenRes.rows[0]?.last_seen ?? null;

  // Hours away
  let hoursAway: number | null = null;
  if (lastSeenAt) {
    const lastSeen = new Date(lastSeenAt);
    hoursAway = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60));
  }

  // Danger level
  let danger: "dead" | "danger" | "warning" | "safe" = "safe";
  if (todayValue === 0) danger = "dead";
  else if (todayValue < todayTarget * 0.4) danger = "danger";
  else if (todayValue < todayTarget) danger = "warning";

  // User rank + rival info
  let userRank: number | null = null;
  let totalPlayers = 0;
  let rivalName: string | null = null;
  let stepsToRival: number | null = null;

  if (inSeason) {
    const rankRes = await db.query<{ rank: string; total: string }>(
      `WITH ranked AS (
         SELECT ud.user_id,
           COALESCE(SUM(a.value), 0) AS total,
           ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.value), 0) DESC) AS rank
         FROM user_disciplines ud
         LEFT JOIN activities a ON a.user_id = ud.user_id AND a.discipline_id = ud.discipline_id AND a.recorded_at::date = CURRENT_DATE
         WHERE ud.discipline_id = $1
         GROUP BY ud.user_id
       )
       SELECT rank::int, (SELECT COUNT(*) FROM ranked)::int AS total
       FROM ranked WHERE user_id = $2`,
      [joinedIds[0], session.userId]
    );
    if (rankRes.rows[0]) {
      userRank = parseInt(rankRes.rows[0].rank as string, 10);
      totalPlayers = parseInt(rankRes.rows[0].total as string, 10);
    }

    // Find the rival just ahead (the one right above in ranking)
    if (userRank && userRank > 1) {
      const rivalRes = await db.query<{ name: string; diff: string }>(
        `WITH ranked AS (
           SELECT ud.user_id, u.name,
             COALESCE(SUM(a.value), 0) AS total,
             ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.value), 0) DESC) AS rank
           FROM user_disciplines ud
           JOIN users u ON u.id = ud.user_id
           LEFT JOIN activities a ON a.user_id = ud.user_id AND a.discipline_id = ud.discipline_id AND a.recorded_at::date = CURRENT_DATE
           WHERE ud.discipline_id = $1
           GROUP BY ud.user_id, u.name
         )
         SELECT name, (total - (SELECT COALESCE(SUM(a2.value), 0) FROM activities a2 WHERE a2.user_id = $2 AND a2.discipline_id = $1 AND a2.recorded_at::date = CURRENT_DATE))::int AS diff
         FROM ranked
         WHERE rank = $3`,
        [joinedIds[0], session.userId, userRank - 1]
      );
      if (rivalRes.rows[0]) {
        rivalName = rivalRes.rows[0].name;
        stepsToRival = parseInt(rivalRes.rows[0].diff as string, 10);
      }
    }
  }

  return NextResponse.json({
    userId: session.userId,
    name: session.name ?? null,
    inSeason,
    joinedIds,
    survival,
    todayValue,
    todayTarget,
    danger,
    userRank,
    totalPlayers,
    rivalsBeaten,
    rivalName,
    stepsToRival,
    hoursAway,
    lastSeenAt,
  });
}
