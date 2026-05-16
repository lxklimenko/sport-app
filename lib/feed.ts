import { getPool } from "./db";

export type FeedItem = {
  id: number;
  type: string;
  user_name: string | null;
  discipline: string | null;
  value: number | null;
  message: string;
  created_at: Date;
};

export type FeedRange = "day" | "week" | "month";

const RANGE_INTERVALS: Record<FeedRange, string> = {
  day:   "1 day",
  week:  "7 days",
  month: "30 days",
};

export async function getLiveFeed(limit = 20): Promise<FeedItem[]> {
  const db = getPool();
  const { rows } = await db.query<FeedItem>(
    `SELECT *
     FROM season_feed
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function getFeedByRange(
  range: FeedRange = "day",
  limit = 50
): Promise<FeedItem[]> {
  const db = getPool();
  const interval = RANGE_INTERVALS[range];
  const { rows } = await db.query<FeedItem>(
    `SELECT *
     FROM season_feed
     WHERE created_at >= NOW() - INTERVAL '${interval}'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}
