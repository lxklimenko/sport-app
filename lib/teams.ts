import "server-only";

import { ensureUsersTable, getPool, hasDatabase } from "@/lib/db";

export type TeamRecord = {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  memberCount: number;
};

export type TeamMember = {
  userId: string;
  userName: string;
  totalSteps: number;
};

export type TeamRanking = {
  team: TeamRecord;
  totalSteps: number;
};

let teamsTableReadyPromise: Promise<void> | null = null;

async function ensureTeamsTable() {
  if (!hasDatabase()) return;
  await ensureUsersTable();

  if (!teamsTableReadyPromise) {
    teamsTableReadyPromise = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS teams (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          emoji TEXT DEFAULT '🏁',
          description TEXT,
          created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)
      .then(() => getPool().query(`
        CREATE TABLE IF NOT EXISTS team_members (
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
          joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (team_id, user_id)
        )
      `))
      .then(() => undefined);
  }
  await teamsTableReadyPromise;
}

export async function createTeam(input: {
  userId: string;
  name: string;
  emoji: string;
  description: string;
}): Promise<TeamRecord> {
  if (!hasDatabase()) throw new Error("Database required");

  const name = input.name.trim();
  if (name.length < 3 || name.length > 40) {
    throw new Error("Название команды от 3 до 40 символов");
  }

  await ensureTeamsTable();

  const existing = await getPool().query(
    `SELECT 1 FROM team_members WHERE user_id = $1`,
    [input.userId]
  );
  if (existing.rows.length > 0) {
    throw new Error("Ты уже состоишь в команде — выйди из неё чтобы создать новую");
  }

  try {
    const result = await getPool().query<{
      id: string;
      name: string;
      emoji: string;
      description: string | null;
      created_by: string;
      created_at: Date;
    }>(
      `INSERT INTO teams (name, emoji, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, emoji, description, created_by, created_at`,
      [name, input.emoji || "🏁", input.description.trim() || null, input.userId]
    );

    const team = result.rows[0];

    await getPool().query(
      `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)`,
      [team.id, input.userId]
    );

    return {
      id: team.id,
      name: team.name,
      emoji: team.emoji,
      description: team.description,
      createdBy: team.created_by,
      createdAt: team.created_at.toISOString(),
      memberCount: 1,
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new Error("Команда с таким названием уже существует");
    }
    throw error;
  }
}

export async function joinTeam(userId: string, teamId: string) {
  if (!hasDatabase()) throw new Error("Database required");
  await ensureTeamsTable();

  const existing = await getPool().query(
    `SELECT 1 FROM team_members WHERE user_id = $1`,
    [userId]
  );
  if (existing.rows.length > 0) {
    throw new Error("Ты уже в команде. Сначала выйди из текущей");
  }

  await getPool().query(
    `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)`,
    [teamId, userId]
  );
}

export async function leaveTeam(userId: string) {
  if (!hasDatabase()) throw new Error("Database required");
  await ensureTeamsTable();

  await getPool().query(
    `DELETE FROM team_members WHERE user_id = $1`,
    [userId]
  );
}

export async function getMyTeam(userId: string): Promise<TeamRecord | null> {
  if (!hasDatabase()) return null;
  await ensureTeamsTable();

  const result = await getPool().query<{
    id: string;
    name: string;
    emoji: string;
    description: string | null;
    created_by: string;
    created_at: Date;
    member_count: string;
  }>(
    `SELECT t.*, 
            (SELECT COUNT(*)::text FROM team_members WHERE team_id = t.id) AS member_count
     FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     WHERE tm.user_id = $1`,
    [userId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    memberCount: Number(row.member_count),
  };
}

export async function getTeamById(teamId: string): Promise<TeamRecord | null> {
  if (!hasDatabase()) return null;
  await ensureTeamsTable();

  const result = await getPool().query<{
    id: string;
    name: string;
    emoji: string;
    description: string | null;
    created_by: string;
    created_at: Date;
    member_count: string;
  }>(
    `SELECT t.*, 
            (SELECT COUNT(*)::text FROM team_members WHERE team_id = t.id) AS member_count
     FROM teams t WHERE t.id = $1`,
    [teamId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    memberCount: Number(row.member_count),
  };
}

export async function getTeamMembers(teamId: string, challengeId?: string): Promise<TeamMember[]> {
  if (!hasDatabase()) return [];
  await ensureTeamsTable();

  if (challengeId) {
    const result = await getPool().query<{
      user_id: string;
      user_name: string;
      total_steps: string;
    }>(
      `SELECT tm.user_id, u.name AS user_name, 
              COALESCE(p.total_steps, 0)::text AS total_steps
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       LEFT JOIN participants p ON p.user_id = tm.user_id AND p.challenge_id = $2
       WHERE tm.team_id = $1
       ORDER BY COALESCE(p.total_steps, 0) DESC`,
      [teamId, challengeId]
    );
    return result.rows.map(r => ({
      userId: r.user_id,
      userName: r.user_name,
      totalSteps: Number(r.total_steps),
    }));
  }

  const result = await getPool().query<{
    user_id: string;
    user_name: string;
  }>(
    `SELECT tm.user_id, u.name AS user_name
     FROM team_members tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = $1
     ORDER BY tm.joined_at ASC`,
    [teamId]
  );
  return result.rows.map(r => ({
    userId: r.user_id,
    userName: r.user_name,
    totalSteps: 0,
  }));
}

export async function getAllTeams(): Promise<TeamRecord[]> {
  if (!hasDatabase()) return [];
  await ensureTeamsTable();

  const result = await getPool().query<{
    id: string;
    name: string;
    emoji: string;
    description: string | null;
    created_by: string;
    created_at: Date;
    member_count: string;
  }>(
    `SELECT t.*, 
            (SELECT COUNT(*)::text FROM team_members WHERE team_id = t.id) AS member_count
     FROM teams t
     ORDER BY member_count DESC, t.created_at DESC`
  );

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    memberCount: Number(row.member_count),
  }));
}

export async function getTeamsRanking(challengeId: string): Promise<TeamRanking[]> {
  if (!hasDatabase()) return [];
  await ensureTeamsTable();

  const result = await getPool().query<{
    team_id: string;
    team_name: string;
    team_emoji: string;
    team_description: string | null;
    team_created_by: string;
    team_created_at: Date;
    member_count: string;
    total_steps: string;
  }>(
    `SELECT 
       t.id AS team_id,
       t.name AS team_name,
       t.emoji AS team_emoji,
       t.description AS team_description,
       t.created_by AS team_created_by,
       t.created_at AS team_created_at,
       COUNT(DISTINCT tm.user_id)::text AS member_count,
       COALESCE(SUM(p.total_steps), 0)::text AS total_steps
     FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     LEFT JOIN participants p ON p.user_id = tm.user_id AND p.challenge_id = $1
     GROUP BY t.id
     HAVING COALESCE(SUM(p.total_steps), 0) > 0
     ORDER BY SUM(p.total_steps) DESC`,
    [challengeId]
  );

  return result.rows.map(row => ({
    team: {
      id: row.team_id,
      name: row.team_name,
      emoji: row.team_emoji,
      description: row.team_description,
      createdBy: row.team_created_by,
      createdAt: row.team_created_at.toISOString(),
      memberCount: Number(row.member_count),
    },
    totalSteps: Number(row.total_steps),
  }));
}