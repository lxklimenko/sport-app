import { getPool } from "./db";

export interface SeasonInfo {
  number: number;
  day: number;
  total: number;
}

export async function getCurrentSeason(): Promise<SeasonInfo> {
  const db = getPool();
  const { rows } = await db.query<{ day: string }>(
    `SELECT COALESCE(
       (EXTRACT(DAY FROM (NOW() - MIN(recorded_at))) + 1)::int, 1
     )::text AS day
     FROM activities`
  );
  const day = Math.min(parseInt(rows[0]?.day ?? "1", 10), 30);
  return { number: 1, day, total: 30 };
}
