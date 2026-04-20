import "server-only";

import { ensureUsersTable, getPool, hasDatabase } from "@/lib/db";

let followsTableReadyPromise: Promise<void> | null = null;

async function ensureFollowsTable() {
  if (!hasDatabase()) return;
  await ensureUsersTable();

  if (!followsTableReadyPromise) {
    followsTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS follows (
          follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (follower_id, following_id),
          CHECK (follower_id <> following_id)
        )
      `)
      .then(() => undefined);
  }
  await followsTableReadyPromise;
}

export async function toggleFollow(followerId: string, followingId: string) {
  if (!hasDatabase()) {
    throw new Error("Database required");
  }
  if (followerId === followingId) {
    throw new Error("Нельзя подписаться на себя");
  }
  await ensureFollowsTable();

  const existing = await getPool().query(
    `SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2`,
    [followerId, followingId]
  );

  if (existing.rows.length > 0) {
    await getPool().query(
      `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId]
    );
    return { following: false };
  } else {
    await getPool().query(
      `INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)`,
      [followerId, followingId]
    );
    return { following: true };
  }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (!hasDatabase()) return false;
  await ensureFollowsTable();

  const result = await getPool().query(
    `SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2`,
    [followerId, followingId]
  );
  return result.rows.length > 0;
}

export async function getFollowCounts(userId: string) {
  if (!hasDatabase()) return { followers: 0, following: 0 };
  await ensureFollowsTable();

  const followersResult = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM follows WHERE following_id = $1`,
    [userId]
  );

  const followingResult = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM follows WHERE follower_id = $1`,
    [userId]
  );

  return {
    followers: Number(followersResult.rows[0]?.count ?? 0),
    following: Number(followingResult.rows[0]?.count ?? 0),
  };
}