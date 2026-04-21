import "server-only";

import { randomUUID } from "node:crypto";

import { ensureUsersTable, ensurePostsTable, getPool, hasDatabase } from "@/lib/db";

export type CommentRecord = {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  text: string;
  createdAt: string;
};

let commentsTableReadyPromise: Promise<void> | null = null;

async function ensureCommentsTable() {
  if (!hasDatabase()) return;
  await ensureUsersTable();
  await ensurePostsTable();

  if (!commentsTableReadyPromise) {
    commentsTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          author_name TEXT NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      .then(() => undefined);
  }
  await commentsTableReadyPromise;
}

export async function createComment(input: {
  postId: string;
  userId: string;
  authorName: string;
  text: string;
}): Promise<CommentRecord> {
  if (!hasDatabase()) {
    throw new Error("Database required");
  }
  await ensureCommentsTable();

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  await getPool().query(
    `INSERT INTO comments (id, post_id, user_id, author_name, text, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, input.postId, input.userId, input.authorName.trim(), input.text.trim(), createdAt]
  );

  const postResult = await getPool().query<{ user_id: string }>(
    `SELECT user_id FROM posts WHERE id = $1`,
    [input.postId]
  );
  const postOwnerId = postResult.rows[0]?.user_id;

  if (postOwnerId && postOwnerId !== input.userId) {
    const { createNotification } = await import("@/lib/notifications");
    await createNotification({
      recipientId: postOwnerId,
      actorId: input.userId,
      actorName: input.authorName.trim(),
      type: "comment",
      postId: input.postId,
      commentId: id,
      textPreview: input.text.trim().slice(0, 100),
    });
  }

  const mentions = input.text.match(/@[\wа-яА-ЯёЁ]+/gu) ?? [];
  for (const mention of mentions) {
    const mentionedName = mention.slice(1).replace(/_/g, " ");
    const userResult = await getPool().query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [mentionedName]
    );
    const mentionedUserId = userResult.rows[0]?.id;

    if (mentionedUserId && mentionedUserId !== input.userId && mentionedUserId !== postOwnerId) {
      const { createNotification } = await import("@/lib/notifications");
      await createNotification({
        recipientId: mentionedUserId,
        actorId: input.userId,
        actorName: input.authorName.trim(),
        type: "mention",
        postId: input.postId,
        commentId: id,
        textPreview: input.text.trim().slice(0, 100),
      });
    }
  }

  return {
    id,
    postId: input.postId,
    userId: input.userId,
    authorName: input.authorName.trim(),
    text: input.text.trim(),
    createdAt,
  };
}

export async function getCommentsByPostId(postId: string): Promise<CommentRecord[]> {
  if (!hasDatabase()) return [];
  await ensureCommentsTable();

  const result = await getPool().query<{
    id: string;
    post_id: string;
    user_id: string;
    author_name: string;
    text: string;
    created_at: Date;
  }>(
    `SELECT id, post_id, user_id, author_name, text, created_at
     FROM comments WHERE post_id = $1 ORDER BY created_at ASC`,
    [postId]
  );

  return result.rows.map(row => ({
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    authorName: row.author_name,
    text: row.text,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function getCommentsCountByPostIds(postIds: string[]): Promise<Record<string, number>> {
  if (!hasDatabase() || postIds.length === 0) return {};
  await ensureCommentsTable();

  const result = await getPool().query<{ post_id: string; cnt: string }>(
    `SELECT post_id, COUNT(*)::text AS cnt 
     FROM comments 
     WHERE post_id = ANY($1::text[]) 
     GROUP BY post_id`,
    [postIds]
  );

  const counts: Record<string, number> = {};
  for (const row of result.rows) {
    counts[row.post_id] = Number(row.cnt);
  }
  return counts;
}

export async function deleteComment(userId: string, commentId: string) {
  if (!hasDatabase()) {
    throw new Error("Database required");
  }
  await ensureCommentsTable();

  const result = await getPool().query(
    `DELETE FROM comments WHERE id = $1 AND user_id = $2`,
    [commentId, userId]
  );

  if (result.rowCount === 0) {
    throw new Error("NOT_FOUND_OR_FORBIDDEN");
  }
}