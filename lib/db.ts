import "server-only";

import { Pool } from "pg";

declare global {
  var __sportAppPool: Pool | undefined;
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim();
}

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

export function getPool() {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!global.__sportAppPool) {
    global.__sportAppPool = new Pool({
      connectionString,
    });
  }

  return global.__sportAppPool;
}

let usersTableReadyPromise: Promise<void> | null = null;
let postsTableReadyPromise: Promise<void> | null = null;

export async function ensureUsersTable() {
  if (!hasDatabase()) {
    return;
  }

  if (!usersTableReadyPromise) {
    usersTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          number INTEGER NOT NULL UNIQUE,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          favorite_format TEXT NOT NULL,
          goal TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      .then(() => undefined);
  }

  await usersTableReadyPromise;
}

export async function ensurePostsTable() {
  if (!hasDatabase()) {
    return;
  }

  if (!postsTableReadyPromise) {
    postsTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          author_name TEXT NOT NULL,
          workout TEXT NOT NULL,
          stats TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      .then(() => undefined);
  }

  await ensureUsersTable();
  await postsTableReadyPromise;
}
