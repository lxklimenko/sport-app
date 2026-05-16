import { NextResponse } from "next/server";
import { migrateDatabase, getPool } from "@/lib/db";
import { migrateSurvival, runDailyReset } from "@/lib/survival";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/daily-reset
 *
 * Called by cron at midnight (or manually for testing).
 * Runs the daily survival check for all users.
 *
 * Protect with a secret key to prevent unauthorized access.
 */
export async function POST(request: Request) {
  // Simple auth check — require a secret key
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.CRON_SECRET;

  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await migrateDatabase();
  await migrateSurvival();

  const result = await runDailyReset();

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    ...result,
  });
}

/**
 * GET /api/cron/daily-reset — for quick health check
 */
export async function GET() {
  return NextResponse.json({
    status: "daily-reset endpoint ready",
    note: "Send POST with Authorization: Bearer <CRON_SECRET> to trigger reset",
  });
}
