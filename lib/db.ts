import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export async function migrateDatabase() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_disciplines (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      discipline_id TEXT NOT NULL,
      joined_at     TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, discipline_id)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      discipline_id TEXT NOT NULL,
      value         NUMERIC,
      unit          TEXT,
      recorded_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
