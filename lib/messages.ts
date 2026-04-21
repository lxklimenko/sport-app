import "server-only";

import { randomUUID } from "node:crypto";

import { ensureUsersTable, getPool, hasDatabase } from "@/lib/db";

export type MessageRecord = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  readAt: string | null;
  createdAt: string;
};

export type DialogPreview = {
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId: string;
  unreadCount: number;
};

let messagesTableReadyPromise: Promise<void> | null = null;

async function ensureMessagesTable() {
  if (!hasDatabase()) return;
  await ensureUsersTable();

  if (!messagesTableReadyPromise) {
    messagesTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          read_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CHECK (sender_id <> receiver_id)
        )
      `)
      .then(() => undefined);
  }
  await messagesTableReadyPromise;
}

export async function sendMessage(input: {
  senderId: string;
  receiverId: string;
  text: string;
}): Promise<MessageRecord> {
  if (!hasDatabase()) {
    throw new Error("Database required");
  }
  if (input.senderId === input.receiverId) {
    throw new Error("Нельзя писать самому себе");
  }
  if (input.text.trim().length < 1 || input.text.length > 2000) {
    throw new Error("Сообщение должно быть от 1 до 2000 символов");
  }
  await ensureMessagesTable();

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  await getPool().query(
    `INSERT INTO messages (id, sender_id, receiver_id, text, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, input.senderId, input.receiverId, input.text.trim(), createdAt]
  );

  return {
    id,
    senderId: input.senderId,
    receiverId: input.receiverId,
    text: input.text.trim(),
    readAt: null,
    createdAt,
  };
}

export async function getDialog(
  userId: string,
  otherUserId: string,
  limit = 100
): Promise<MessageRecord[]> {
  if (!hasDatabase()) return [];
  await ensureMessagesTable();

  const result = await getPool().query<{
    id: string;
    sender_id: string;
    receiver_id: string;
    text: string;
    read_at: Date | null;
    created_at: Date;
  }>(
    `SELECT id, sender_id, receiver_id, text, read_at, created_at
     FROM messages
     WHERE (sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at ASC
     LIMIT $3`,
    [userId, otherUserId, limit]
  );

  return result.rows.map(row => ({
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    text: row.text,
    readAt: row.read_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function markDialogAsRead(userId: string, otherUserId: string) {
  if (!hasDatabase()) return;
  await ensureMessagesTable();

  await getPool().query(
    `UPDATE messages SET read_at = NOW()
     WHERE receiver_id = $1 AND sender_id = $2 AND read_at IS NULL`,
    [userId, otherUserId]
  );
}

export async function getMyDialogs(userId: string): Promise<DialogPreview[]> {
  if (!hasDatabase()) return [];
  await ensureMessagesTable();

  const result = await getPool().query<{
    other_user_id: string;
    other_user_name: string;
    last_message: string;
    last_message_at: Date;
    last_sender_id: string;
    unread_count: string;
  }>(
    `WITH pairs AS (
      SELECT
        CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_user_id,
        id, sender_id, receiver_id, text, read_at, created_at
      FROM messages
      WHERE sender_id = $1 OR receiver_id = $1
    ),
    latest AS (
      SELECT DISTINCT ON (other_user_id)
        other_user_id, text AS last_message, created_at AS last_message_at,
        sender_id AS last_sender_id
      FROM pairs
      ORDER BY other_user_id, created_at DESC
    ),
    unread AS (
      SELECT sender_id AS other_user_id, COUNT(*)::text AS cnt
      FROM messages
      WHERE receiver_id = $1 AND read_at IS NULL
      GROUP BY sender_id
    )
    SELECT
      l.other_user_id,
      u.name AS other_user_name,
      l.last_message,
      l.last_message_at,
      l.last_sender_id,
      COALESCE(unread.cnt, '0') AS unread_count
    FROM latest l
    JOIN users u ON u.id = l.other_user_id
    LEFT JOIN unread ON unread.other_user_id = l.other_user_id
    ORDER BY l.last_message_at DESC`,
    [userId]
  );

  return result.rows.map(row => ({
    otherUserId: row.other_user_id,
    otherUserName: row.other_user_name,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at.toISOString(),
    lastSenderId: row.last_sender_id,
    unreadCount: Number(row.unread_count),
  }));
}

export async function getUnreadMessagesCount(userId: string): Promise<number> {
  if (!hasDatabase()) return 0;
  await ensureMessagesTable();

  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM messages
     WHERE receiver_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return Number(result.rows[0]?.count ?? 0);
}
