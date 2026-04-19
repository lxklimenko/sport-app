import "server-only";

import { ensureUsersTable, getPool, hasDatabase } from "@/lib/db";

export type ChallengeRecord = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  days: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export type LeaderEntry = {
  userId: string;
  userName: string;
  totalSteps: number;
};

let challengesTableReadyPromise: Promise<void> | null = null;
let participantsTableReadyPromise: Promise<void> | null = null;
let stepEntriesTableReadyPromise: Promise<void> | null = null;

async function ensureChallengesTable() {
  if (!hasDatabase()) return;
  if (!challengesTableReadyPromise) {
    challengesTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS challenges (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          emoji TEXT DEFAULT '🏆',
          days INTEGER NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      .then(() => undefined);
  }
  await challengesTableReadyPromise;
}

async function ensureParticipantsTable() {
  if (!hasDatabase()) return;
  await ensureUsersTable();
  await ensureChallengesTable();
  if (!participantsTableReadyPromise) {
    participantsTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS participants (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
          total_steps BIGINT DEFAULT 0,
          joined_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (user_id, challenge_id)
        )
      `)
      .then(() => undefined);
  }
  await participantsTableReadyPromise;
}

async function ensureStepEntriesTable() {
  if (!hasDatabase()) return;
  await ensureParticipantsTable();
  if (!stepEntriesTableReadyPromise) {
    stepEntriesTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS step_entries (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
          steps INTEGER NOT NULL CHECK (steps > 0 AND steps <= 50000),
          entry_date DATE DEFAULT CURRENT_DATE,
          image_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      .then(() => undefined);
  }
  await stepEntriesTableReadyPromise;
}

export async function getActiveChallenge(): Promise<ChallengeRecord | null> {
  if (!hasDatabase()) return null;
  await ensureChallengesTable();

  const result = await getPool().query<{
    id: string;
    title: string;
    description: string | null;
    emoji: string;
    days: number;
    start_date: Date;
    end_date: Date;
    is_active: boolean;
  }>(
    `SELECT * FROM challenges WHERE is_active = true ORDER BY created_at DESC LIMIT 1`
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    emoji: row.emoji,
    days: row.days,
    startDate: row.start_date.toISOString(),
    endDate: row.end_date.toISOString(),
    isActive: row.is_active,
  };
}

export async function joinChallenge(userId: string, challengeId: string) {
  await ensureParticipantsTable();
  await getPool().query(
    `INSERT INTO participants (user_id, challenge_id) 
     VALUES ($1, $2) 
     ON CONFLICT (user_id, challenge_id) DO NOTHING`,
    [userId, challengeId]
  );
}

export async function isParticipant(userId: string, challengeId: string) {
  if (!hasDatabase()) return false;
  await ensureParticipantsTable();
  const result = await getPool().query(
    `SELECT 1 FROM participants WHERE user_id = $1 AND challenge_id = $2`,
    [userId, challengeId]
  );
  return result.rows.length > 0;
}

export async function addSteps(userId: string, challengeId: string, steps: number) {
  if (steps <= 0 || steps > 50000) {
    throw new Error("Шаги должны быть от 1 до 50 000");
  }
  await ensureStepEntriesTable();
  await getPool().query(
    `INSERT INTO step_entries (user_id, challenge_id, steps) VALUES ($1, $2, $3)`,
    [userId, challengeId, steps]
  );
}

export async function getMyStats(userId: string, challengeId: string) {
  if (!hasDatabase()) return null;
  await ensureParticipantsTable();

  const result = await getPool().query<{ total_steps: string }>(
    `SELECT total_steps::text FROM participants WHERE user_id = $1 AND challenge_id = $2`,
    [userId, challengeId]
  );

  const row = result.rows[0];
  if (!row) return null;

  const totalSteps = Number(row.total_steps);

  const rankResult = await getPool().query<{ rank: string }>(
    `SELECT COUNT(*) + 1 AS rank 
     FROM participants 
     WHERE challenge_id = $1 AND total_steps > $2`,
    [challengeId, totalSteps]
  );

  const totalResult = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM participants WHERE challenge_id = $1`,
    [challengeId]
  );

  return {
    totalSteps,
    rank: Number(rankResult.rows[0]?.rank ?? 1),
    totalParticipants: Number(totalResult.rows[0]?.count ?? 0),
  };
}

export async function getLeaderboard(challengeId: string, limit = 10): Promise<LeaderEntry[]> {
  if (!hasDatabase()) return [];
  await ensureParticipantsTable();

  const result = await getPool().query<{
    user_id: string;
    user_name: string;
    total_steps: string;
  }>(
    `SELECT p.user_id, u.name AS user_name, p.total_steps::text
     FROM participants p
     JOIN users u ON u.id = p.user_id
     WHERE p.challenge_id = $1
     ORDER BY p.total_steps DESC
     LIMIT $2`,
    [challengeId, limit]
  );

  return result.rows.map(row => ({
    userId: row.user_id,
    userName: row.user_name,
    totalSteps: Number(row.total_steps),
  }));
}

export async function getParticipantsCount(challengeId: string) {
  if (!hasDatabase()) return 0;
  await ensureParticipantsTable();
  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM participants WHERE challenge_id = $1`,
    [challengeId]
  );
  return Number(result.rows[0]?.count ?? 0);
}