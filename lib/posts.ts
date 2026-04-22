import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensurePostsTable, getPool, hasDatabase } from "@/lib/db";

export type PostRecord = {
  id: string;
  userId: string;
  authorName: string;
  workout: string;
  stats: string;
  imageUrl: string | null;
  isMicroStep: boolean;
  createdAt: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const postsFile = path.join(dataDirectory, "posts.json");

async function ensurePostsFile() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(postsFile, "utf8");
  } catch {
    await writeFile(postsFile, "[]\n", "utf8");
  }
}

async function readPosts() {
  await ensurePostsFile();
  const raw = await readFile(postsFile, "utf8");
  const posts = JSON.parse(raw) as PostRecord[];
  // Нормализация: для старых постов без поля isMicroStep устанавливаем false
  return posts.map((post) => ({
    ...post,
    isMicroStep: post.isMicroStep ?? false,
  }));
}

async function writePosts(posts: PostRecord[]) {
  await ensurePostsFile();
  await writeFile(postsFile, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
}

export async function createPost(input: {
  userId: string;
  authorName: string;
  workout: string;
  stats: string;
  imageUrl?: string | null;
  isMicroStep?: boolean;
}) {
  const post: PostRecord = {
    id: randomUUID(),
    userId: input.userId,
    authorName: input.authorName.trim(),
    workout: input.workout.trim(),
    stats: input.stats.trim(),
    imageUrl: input.imageUrl ?? null,
    isMicroStep: input.isMicroStep ?? false,
    createdAt: new Date().toISOString(),
  };

  if (hasDatabase()) {
    await ensurePostsTable();
    await getPool().query(
      `INSERT INTO posts (id, user_id, author_name, workout, stats, image_url, is_micro_step, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        post.id,
        post.userId,
        post.authorName,
        post.workout,
        post.stats,
        post.imageUrl,
        post.isMicroStep,
        post.createdAt,
      ],
    );
    return post;
  }

  const posts = await readPosts();
  posts.unshift(post);
  await writePosts(posts);
  return post;
}

export async function getRecentPosts(limit = 20, currentUserId?: string) {
  if (hasDatabase()) {
    await ensurePostsTable();
    await ensureLikesTable();

    const result = await getPool().query<{
      id: string;
      user_id: string;
      author_name: string;
      workout: string;
      stats: string;
      image_url: string | null;
      is_micro_step: boolean;
      created_at: Date;
      likes_count: string;
      liked_by_me: boolean;
    }>(
      `SELECT p.id, p.user_id, p.author_name, p.workout, p.stats, p.image_url, p.is_micro_step, p.created_at,
              COALESCE(l.cnt, 0)::text AS likes_count,
              CASE WHEN ml.user_id IS NOT NULL THEN true ELSE false END AS liked_by_me
       FROM posts p
       LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM likes GROUP BY post_id) l ON l.post_id = p.id
       LEFT JOIN likes ml ON ml.post_id = p.id AND ml.user_id = $2
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit, currentUserId ?? ""],
    );

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      authorName: row.author_name,
      workout: row.workout,
      stats: row.stats,
      imageUrl: row.image_url,
      isMicroStep: row.is_micro_step,
      createdAt: row.created_at.toISOString(),
      likesCount: Number(row.likes_count),
      likedByMe: row.liked_by_me,
    }));
  }

  const posts = await readPosts();
  return posts.slice(0, limit).map((p) => ({ ...p, likesCount: 0, likedByMe: false }));
}

export async function toggleLike(userId: string, postId: string) {
  if (!hasDatabase()) {
    throw new Error("Database required for likes");
  }
  await ensurePostsTable();
  await ensureLikesTable();

  const existing = await getPool().query(
    `SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2`,
    [userId, postId]
  );

  const postResult = await getPool().query<{ user_id: string }>(
    `SELECT user_id FROM posts WHERE id = $1`,
    [postId]
  );
  const postOwnerId = postResult.rows[0]?.user_id;

  const actorResult = await getPool().query<{ name: string }>(
    `SELECT name FROM users WHERE id = $1`,
    [userId]
  );
  const actorName = actorResult.rows[0]?.name;

  if (existing.rows.length > 0) {
    await getPool().query(
      `DELETE FROM likes WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );
    if (postOwnerId && postOwnerId !== userId) {
      const { removeNotification } = await import("@/lib/notifications");
      await removeNotification({
        recipientId: postOwnerId,
        actorId: userId,
        type: "like",
        postId,
      });
    }
    return { liked: false };
  } else {
    await getPool().query(
      `INSERT INTO likes (user_id, post_id) VALUES ($1, $2)`,
      [userId, postId]
    );
    if (postOwnerId && actorName && postOwnerId !== userId) {
      const { createNotification } = await import("@/lib/notifications");
      await createNotification({
        recipientId: postOwnerId,
        actorId: userId,
        actorName,
        type: "like",
        postId,
      });
    }
    return { liked: true };
  }
}

let likesTableReadyPromise: Promise<void> | null = null;

async function ensureLikesTable() {
  if (!hasDatabase()) return;
  if (!likesTableReadyPromise) {
    likesTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS likes (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, post_id)
        )
      `)
      .then(() => undefined);
  }
  await likesTableReadyPromise;
}

export async function deletePost(userId: string, postId: string) {
  if (!hasDatabase()) {
    throw new Error("Database required");
  }
  await ensurePostsTable();

  const result = await getPool().query<{ image_url: string | null }>(
    `SELECT image_url FROM posts WHERE id = $1 AND user_id = $2`,
    [postId, userId]
  );

  const post = result.rows[0];
  if (!post) {
    throw new Error("NOT_FOUND_OR_FORBIDDEN");
  }

  await getPool().query(
    `DELETE FROM posts WHERE id = $1 AND user_id = $2`,
    [postId, userId]
  );

  if (post.image_url) {
    try {
      const { unlink } = await import("node:fs/promises");
      const filename = post.image_url.replace("/uploads/", "");
      const filepath = path.join(process.cwd(), "public", "uploads", filename);
      await unlink(filepath);
    } catch (error) {
      console.error("Failed to delete photo file:", error);
    }
  }
}

export async function getFollowingPosts(userId: string, limit = 20) {
  if (!hasDatabase()) return [];
  await ensurePostsTable();
  await ensureLikesTable();

  const result = await getPool().query<{
    id: string;
    user_id: string;
    author_name: string;
    workout: string;
    stats: string;
    image_url: string | null;
    is_micro_step: boolean;
    created_at: Date;
    likes_count: string;
    liked_by_me: boolean;
  }>(
    `SELECT p.id, p.user_id, p.author_name, p.workout, p.stats, p.image_url, p.is_micro_step, p.created_at,
            COALESCE(l.cnt, 0)::text AS likes_count,
            CASE WHEN ml.user_id IS NOT NULL THEN true ELSE false END AS liked_by_me
     FROM posts p
     JOIN follows f ON f.following_id = p.user_id AND f.follower_id = $1
     LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM likes GROUP BY post_id) l ON l.post_id = p.id
     LEFT JOIN likes ml ON ml.post_id = p.id AND ml.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name,
    workout: row.workout,
    stats: row.stats,
    imageUrl: row.image_url,
    isMicroStep: row.is_micro_step,
    createdAt: row.created_at.toISOString(),
    likesCount: Number(row.likes_count),
    likedByMe: row.liked_by_me,
  }));
}