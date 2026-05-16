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
