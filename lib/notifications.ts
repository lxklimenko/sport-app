import "server-only";

import { randomUUID } from "node:crypto";

import { ensureUsersTable, getPool, hasDatabase } from "@/lib/db";

export type NotificationType = "like" | "comment" | "follow" | "mention";

export type NotificationRecord = {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  type: NotificationType;
  postId: string | null;
  commentId: string | null;
  textPreview: string | null;
  readAt: string | null;
  createdAt: string;
};

let notificationsTableReadyPromise: Promise<void> | null = null;

async function ensureNotificationsTable() {
  if (!hasDatabase()) return;
  await ensureUsersTable();

  if (!notificationsTableReadyPromise) {
    notificationsTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          actor_name TEXT NOT NULL,
          type TEXT NOT NULL,
          post_id TEXT,
          comment_id TEXT,
          text_preview TEXT,
          read_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CHECK (recipient_id <> actor_id)
        )
      `)
      .then(() => undefined);
  }
  await notificationsTableReadyPromise;
}

export async function createNotification(input: {
  recipientId: string;
  actorId: string;
  actorName: string;
  type: NotificationType;
  postId?: string | null;
  commentId?: string | null;
  textPreview?: string | null;
}) {
  if (!hasDatabase()) return;
  if (input.recipientId === input.actorId) return;

  await ensureNotificationsTable();

  await getPool().query(
    `INSERT INTO notifications (id, recipient_id, actor_id, actor_name, type, post_id, comment_id, text_preview)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      randomUUID(),
      input.recipientId,
      input.actorId,
      input.actorName,
      input.type,
      input.postId ?? null,
      input.commentId ?? null,
      input.textPreview ?? null,
    ]
  );
}

export async function removeNotification(input: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string | null;
}) {
  if (!hasDatabase()) return;
  await ensureNotificationsTable();

  await getPool().query(
    `DELETE FROM notifications 
     WHERE recipient_id = $1 AND actor_id = $2 AND type = $3 
       AND (post_id = $4 OR ($4 IS NULL AND post_id IS NULL))`,
    [input.recipientId, input.actorId, input.type, input.postId ?? null]
  );
}

export async function getMyNotifications(userId: string, limit = 50): Promise<NotificationRecord[]> {
  if (!hasDatabase()) return [];
  await ensureNotificationsTable();

  const result = await getPool().query<{
    id: string;
    recipient_id: string;
    actor_id: string;
    actor_name: string;
    type: string;
    post_id: string | null;
    comment_id: string | null;
    text_preview: string | null;
    read_at: Date | null;
    created_at: Date;
  }>(
    `SELECT id, recipient_id, actor_id, actor_name, type, 
            post_id, comment_id, text_preview, read_at, created_at
     FROM notifications
     WHERE recipient_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows.map(row => ({
    id: row.id,
    recipientId: row.recipient_id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    type: row.type as NotificationType,
    postId: row.post_id,
    commentId: row.comment_id,
    textPreview: row.text_preview,
    readAt: row.read_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function markAllAsRead(userId: string) {
  if (!hasDatabase()) return;
  await ensureNotificationsTable();

  await getPool().query(
    `UPDATE notifications SET read_at = NOW() 
     WHERE recipient_id = $1 AND read_at IS NULL`,
    [userId]
  );
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  if (!hasDatabase()) return 0;
  await ensureNotificationsTable();

  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM notifications 
     WHERE recipient_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return Number(result.rows[0]?.count ?? 0);
}