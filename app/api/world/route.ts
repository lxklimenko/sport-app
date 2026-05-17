import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/**
 * Returns "while you were away" data — what happened recently.
 * Used by the main page to show the world is alive.
 */
export async function GET() {
  const db = getPool();

  // Recent eliminations (last 30 min)
  const { rows: recentEliminations } = await db.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count
     FROM season_feed
     WHERE type = 'elimination' AND created_at > NOW() - INTERVAL '30 minutes'`
  );

  // Recent entries into TOP 3
  const { rows: recentTop3 } = await db.query<{ name: string; discipline: string }>(
    `SELECT DISTINCT ON (sf.user_name) sf.user_name AS name, sf.discipline
     FROM season_feed sf
     WHERE sf.type = 'activity' AND sf.message LIKE '%TOP 3%' AND sf.created_at > NOW() - INTERVAL '1 hour'
     ORDER BY sf.user_name, sf.created_at DESC
     LIMIT 3`
  );

  // New events started
  const { rows: newEvents } = await db.query<{ title: string; emoji: string | null }>(
    `SELECT title, emoji
     FROM season_events
     WHERE starts_at > NOW() - INTERVAL '1 hour' AND starts_at <= NOW()
     ORDER BY starts_at DESC
     LIMIT 2`
  );

  // Total active users right now
  const { rows: activeNow } = await db.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count
     FROM activities
     WHERE recorded_at > NOW() - INTERVAL '5 minutes'`
  );

  // Someone overtook someone (last 15 min — simulated from feed)
  const { rows: recentOvertakes } = await db.query<{ message: string }>(
    `SELECT message
     FROM season_feed
     WHERE type = 'activity' AND message LIKE '%обогнал%' AND created_at > NOW() - INTERVAL '15 minutes'
     LIMIT 2`
  );

  return NextResponse.json({
    eliminated: parseInt(recentEliminations[0]?.count ?? "0", 10),
    top3Entries: recentTop3.map((r) => r.name.split(/\s+/)[0]),
    newEvents: newEvents.map((e) => ({ title: e.title, emoji: e.emoji })),
    activeNow: parseInt(activeNow[0]?.count ?? "0", 10),
    overtakes: recentOvertakes.map((r) => r.message),
  });
}
