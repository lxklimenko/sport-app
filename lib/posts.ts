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
  return JSON.parse(raw) as PostRecord[];
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
}) {
  const post: PostRecord = {
    id: randomUUID(),
    userId: input.userId,
    authorName: input.authorName.trim(),
    workout: input.workout.trim(),
    stats: input.stats.trim(),
    imageUrl: input.imageUrl ?? null,
    createdAt: new Date().toISOString(),
  };

  if (hasDatabase()) {
    await ensurePostsTable();
    await getPool().query(
      `INSERT INTO posts (id, user_id, author_name, workout, stats, image_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        post.id,
        post.userId,
        post.authorName,
        post.workout,
        post.stats,
        post.imageUrl,
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
      created_at: Date;
      likes_count: string;
      liked_by_me: boolean;
    }>(
      `SELECT p.id, p.user_id, p.author_name, p.workout, p.stats, p.image_url, p.created_at,
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
      createdAt: row.created_at.toISOString(),
      likesCount: Number(row.likes_count),
      likedByMe: row.liked_by_me,
    }));
  }

  const posts = await readPosts();
  return posts.slice(0, limit).map(p => ({ ...p, likesCount: 0, likedByMe: false }));
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

  if (existing.rows.length > 0) {
    await getPool().query(
      `DELETE FROM likes WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );
    return { liked: false };
  } else {
    await getPool().query(
      `INSERT INTO likes (user_id, post_id) VALUES ($1, $2)`,
      [userId, postId]
    );
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