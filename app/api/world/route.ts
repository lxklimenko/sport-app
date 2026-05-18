import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/**
 * Returns "while you were away" data — what happened recently.
 * Also returns world statistics for the main page.
 */
export async function GET() {
  const db = getPool();

  const [
    recentEliminations,
    recentTop3,
    newEvents,
    activeNow,
    recentOvertakes,
    totalUsers,
    totalDisciplines,
    seasonDays,
    notMetTarget,
    eventsActive,
    lastSurvivors,
    totalPlayers,
  ] = await Promise.all([
    // Recent eliminations (last 30 min)
    db.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count
       FROM season_feed
       WHERE type = 'elimination' AND created_at > NOW() - INTERVAL '30 minutes'`
    ),
    // Recent entries into TOP 3
    db.query<{ name: string; discipline: string }>(
      `SELECT DISTINCT ON (sf.user_name) sf.user_name AS name, sf.discipline
       FROM season_feed sf
       WHERE sf.type = 'activity' AND sf.message LIKE '%TOP 3%' AND sf.created_at > NOW() - INTERVAL '1 hour'
       ORDER BY sf.user_name, sf.created_at DESC
       LIMIT 3`
    ),
    // New events started
    db.query<{ title: string; emoji: string | null }>(
      `SELECT title, emoji
       FROM season_events
       WHERE starts_at > NOW() - INTERVAL '1 hour' AND starts_at <= NOW()
       ORDER BY starts_at DESC
       LIMIT 2`
    ),
    // Total active users right now
    db.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count
       FROM activities
       WHERE recorded_at > NOW() - INTERVAL '5 minutes'`
    ),
    // Someone overtook someone (last 15 min — simulated from feed)
    db.query<{ message: string }>(
      `SELECT message
       FROM season_feed
       WHERE type = 'activity' AND message LIKE '%обогнал%' AND created_at > NOW() - INTERVAL '15 minutes'
       LIMIT 2`
    ),
    // Total users
    db.query<{ count: string }>("SELECT COUNT(*)::int AS count FROM users"),
    // Total disciplines with active users
    db.query<{ count: string }>(
      `SELECT COUNT(DISTINCT discipline_id)::int AS count FROM user_disciplines`
    ),
    // Season day (from first activity)
    db.query<{ day: string }>(
      `SELECT COALESCE(
        (EXTRACT(DAY FROM (NOW() - MIN(recorded_at))) + 1)::int, 1
       )::text AS day
       FROM activities`
    ),
    // Users who haven't met their daily target today
    db.query<{ count: string }>(
      `SELECT COUNT(DISTINCT ud.user_id)::int AS count
       FROM user_disciplines ud
       LEFT JOIN activities a
         ON a.user_id = ud.user_id
         AND a.discipline_id = ud.discipline_id
         AND a.recorded_at::date = CURRENT_DATE
       WHERE ud.discipline_id = 'steps'
       GROUP BY ud.user_id
       HAVING COALESCE(SUM(a.value), 0) < 10000
       LIMIT 1`
    ),
    // Active events
    db.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count
       FROM season_events
       WHERE is_active = true AND ends_at > NOW()`
    ),
    // Last survivors count
    db.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count
       FROM user_survival
       WHERE is_alive = TRUE`
    ),
    // Total players (distinct users in disciplines)
    db.query<{ count: string }>(
      `SELECT COUNT(DISTINCT user_id)::int AS count FROM user_disciplines`
    ),
  ]);

  return NextResponse.json({
    // "While you were away" data
    eliminated: parseInt(recentEliminations.rows[0]?.count ?? "0", 10),
    top3Entries: recentTop3.rows.map((r) => r.name.split(/\s+/)[0]),
    newEvents: newEvents.rows.map((e) => ({ title: e.title, emoji: e.emoji })),
    activeNow: parseInt(activeNow.rows[0]?.count ?? "0", 10),
    overtakes: recentOvertakes.rows.map((r) => r.message),

    // World statistics
    totalUsers: parseInt(totalUsers.rows[0]?.count ?? "0", 10),
    totalDisciplines: parseInt(totalDisciplines.rows[0]?.count ?? "0", 10),
    seasonDay: parseInt(seasonDays.rows[0]?.day ?? "1", 10),
    notMetTarget: parseInt(notMetTarget.rows[0]?.count ?? "0", 10),
    eventsActive: parseInt(eventsActive.rows[0]?.count ?? "0", 10),
    lastSurvivors: parseInt(lastSurvivors.rows[0]?.count ?? "0", 10),
    totalPlayers: parseInt(totalPlayers.rows[0]?.count ?? "0", 10),
  });
}
