import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { migrateEvents, getLiveEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await migrateEvents();
    const events = await getLiveEvents();

    // Enrich with participant counts
    const db = getPool();
    const enriched = await Promise.all(
      events.map(async (e) => {
        const { rows: countRows } = await db.query(
          `SELECT
             COUNT(*)::int AS total,
             COALESCE(SUM(CASE WHEN is_alive = true THEN 1 ELSE 0 END), 0)::int AS alive,
             COALESCE(SUM(CASE WHEN is_alive = false THEN 1 ELSE 0 END), 0)::int AS eliminated
           FROM event_participants
           WHERE event_id = $1`,
          [e.id]
        );
        return {
          ...e,
          participant_count: countRows[0]?.total ?? 0,
          alive_count: countRows[0]?.alive ?? 0,
          eliminated_count: countRows[0]?.eliminated ?? 0,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to fetch live events:", error);
    return NextResponse.json([], { status: 500 });
  }
}
