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
}) {
  const post: PostRecord = {
    id: randomUUID(),
    userId: input.userId,
    authorName: input.authorName.trim(),
    workout: input.workout.trim(),
    stats: input.stats.trim(),
    createdAt: new Date().toISOString(),
  };

  if (hasDatabase()) {
    await ensurePostsTable();
    await getPool().query(
      `
        INSERT INTO posts (
          id,
          user_id,
          author_name,
          workout,
          stats,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        post.id,
        post.userId,
        post.authorName,
        post.workout,
        post.stats,
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

export async function getRecentPosts(limit = 20) {
  if (hasDatabase()) {
    await ensurePostsTable();
    const result = await getPool().query<{
      id: string;
      user_id: string;
      author_name: string;
      workout: string;
      stats: string;
      created_at: Date;
    }>(
      `
        SELECT
          id,
          user_id,
          author_name,
          workout,
          stats,
          created_at
        FROM posts
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit],
    );

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      authorName: row.author_name,
      workout: row.workout,
      stats: row.stats,
      createdAt: row.created_at.toISOString(),
    }));
  }

  const posts = await readPosts();
  return posts.slice(0, limit);
}
