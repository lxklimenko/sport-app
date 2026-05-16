import { getPool } from "./db";

export type EventMode = "daily_survival" | "total_score" | "speed_run" | "last_man_standing";

export interface SeasonEvent {
  id: string;
  title: string;
  slug: string;
  discipline: string;
  mode: EventMode;
  description: string | null;
  starts_at: string;
  ends_at: string;
  daily_target: number | null;
  total_target: number | null;
  is_survival: boolean;
  allow_eliminated: boolean;
  badge_color: string | null;
  emoji: string | null;
  is_active: boolean;
  created_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  value: number;
  is_alive: boolean;
  joined_at: string;
}

// ─── Migration ───────────────────────────────────────────────────────────────

export async function migrateEvents() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS season_events (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title           TEXT NOT NULL,
      slug            TEXT UNIQUE NOT NULL,
      discipline      TEXT NOT NULL,
      mode            TEXT NOT NULL,
      description     TEXT,
      starts_at       TIMESTAMPTZ NOT NULL,
      ends_at         TIMESTAMPTZ NOT NULL,
      daily_target    INTEGER,
      total_target    INTEGER,
      is_survival     BOOLEAN DEFAULT false,
      allow_eliminated BOOLEAN DEFAULT true,
      badge_color     TEXT,
      emoji           TEXT,
      is_active       BOOLEAN DEFAULT true,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS event_participants (
      id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id  UUID NOT NULL REFERENCES season_events(id) ON DELETE CASCADE,
      user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      value     NUMERIC DEFAULT 0,
      is_alive  BOOLEAN DEFAULT true,
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(event_id, user_id)
    )
  `);
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createEvent(event: {
  title: string;
  slug: string;
  discipline: string;
  mode: EventMode;
  description?: string;
  starts_at: string;
  ends_at: string;
  daily_target?: number;
  total_target?: number;
  is_survival?: boolean;
  allow_eliminated?: boolean;
  badge_color?: string;
  emoji?: string;
}): Promise<SeasonEvent> {
  const db = getPool();
  const { rows } = await db.query<SeasonEvent>(
    `INSERT INTO season_events (title, slug, discipline, mode, description, starts_at, ends_at, daily_target, total_target, is_survival, allow_eliminated, badge_color, emoji)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      event.title,
      event.slug,
      event.discipline,
      event.mode,
      event.description ?? null,
      event.starts_at,
      event.ends_at,
      event.daily_target ?? null,
      event.total_target ?? null,
      event.is_survival ?? false,
      event.allow_eliminated ?? true,
      event.badge_color ?? null,
      event.emoji ?? null,
    ]
  );
  return rows[0];
}

export async function getUpcomingEvents(limit = 5): Promise<SeasonEvent[]> {
  const db = getPool();
  const { rows } = await db.query<SeasonEvent>(
    `SELECT * FROM season_events
     WHERE ends_at > NOW()
     ORDER BY starts_at ASC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function getLiveEvents(): Promise<SeasonEvent[]> {
  const db = getPool();
  const { rows } = await db.query<SeasonEvent>(
    `SELECT * FROM season_events
     WHERE starts_at <= NOW() AND ends_at > NOW() AND is_active = true
     ORDER BY starts_at ASC`
  );
  return rows;
}

export async function getAllEvents(): Promise<SeasonEvent[]> {
  const db = getPool();
  const { rows } = await db.query<SeasonEvent>(
    `SELECT * FROM season_events
     ORDER BY starts_at DESC`
  );
  return rows;
}

export async function joinEvent(eventId: string, userId: string): Promise<EventParticipant> {
  const db = getPool();
  const { rows } = await db.query<EventParticipant>(
    `INSERT INTO event_participants (event_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (event_id, user_id) DO NOTHING
     RETURNING *`,
    [eventId, userId]
  );
  return rows[0];
}

export async function getEventBySlug(slug: string): Promise<SeasonEvent | null> {
  const db = getPool();
  const { rows } = await db.query<SeasonEvent>(
    `SELECT * FROM season_events WHERE slug = $1`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function getEventById(id: string): Promise<SeasonEvent | null> {
  const db = getPool();
  const { rows } = await db.query<SeasonEvent>(
    `SELECT * FROM season_events WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

// ─── Auto-start: mark events as active when starts_at <= NOW() ──────────────

export async function autoStartEvents() {
  const db = getPool();
  const { rows } = await db.query<SeasonEvent>(
    `UPDATE season_events
     SET is_active = true
     WHERE starts_at <= NOW() AND is_active = false
     RETURNING *`
  );
  return rows;
}

// ─── Get events for a user (with participation status) ──────────────────────

export async function getEventsWithParticipation(userId: string): Promise<(SeasonEvent & { joined: boolean })[]> {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT e.*,
            CASE WHEN ep.user_id IS NOT NULL THEN true ELSE false END AS joined
     FROM season_events e
     LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.user_id = $1
     WHERE e.ends_at > NOW()
     ORDER BY e.starts_at ASC`,
    [userId]
  );
  return rows;
}
