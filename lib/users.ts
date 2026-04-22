import "server-only";

import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureUsersTable, getPool, hasDatabase } from "@/lib/db";

export type UserRecord = {
  id: string;
  number: number;
  name: string;
  email: string;
  passwordHash: string;
  favoriteFormat: string;
  goal: string;
  createdAt: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const usersFile = path.join(dataDirectory, "users.json");

async function ensureUsersFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(usersFile, "utf8");
  } catch {
    await writeFile(usersFile, "[]\n", "utf8");
  }
}

async function readUsers() {
  await ensureUsersFile();
  const raw = await readFile(usersFile, "utf8");
  return JSON.parse(raw) as UserRecord[];
}

async function writeUsers(users: UserRecord[]) {
  await ensureUsersFile();
  await writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

function hashPassword(password: string) {
  const salt = randomUUID();
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const actual = Buffer.from(hash, "hex");

  if (candidate.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(candidate, actual);
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  favoriteFormat: string;
  goal: string;
}) {
  console.log("CREATE USER CALLED");
  console.log("DB URL:", process.env.DATABASE_URL);
  console.log("HAS DB:", hasDatabase());

  const normalizedEmail = input.email.trim().toLowerCase();

  if (hasDatabase()) {
    await ensureUsersTable();
    const pool = getPool();
    const countResult = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM users",
    );

    const user: UserRecord = {
      id: randomUUID(),
      number: Number(countResult.rows[0]?.count ?? "0") + 1,
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(input.password),
      favoriteFormat: input.favoriteFormat.trim(),
      goal: input.goal.trim(),
      createdAt: new Date().toISOString(),
    };

    console.log("INSERTING USER:", user);

    try {
      await pool.query(
        `
          INSERT INTO users (
            id,
            number,
            name,
            email,
            password_hash,
            favorite_format,
            goal,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          user.id,
          user.number,
          user.name,
          user.email,
          user.passwordHash,
          user.favoriteFormat,
          user.goal,
          user.createdAt,
        ],
      );
    } catch (error) {
      console.error("INSERT ERROR:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new Error("USER_EXISTS");
      }

      throw error;
    }

    return user;
  }

  const users = await readUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("USER_EXISTS");
  }

  const user: UserRecord = {
    id: randomUUID(),
    number: users.length + 1,
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
    favoriteFormat: input.favoriteFormat.trim(),
    goal: input.goal.trim(),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeUsers(users);

  return user;
}

export async function getUserById(userId: string) {
  if (hasDatabase()) {
    await ensureUsersTable();
    const result = await getPool().query<{
      id: string;
      number: number;
      name: string;
      email: string;
      password_hash: string;
      favorite_format: string;
      goal: string;
      created_at: Date;
    }>(
      `
        SELECT
          id,
          number,
          name,
          email,
          password_hash,
          favorite_format,
          goal,
          created_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      number: row.number,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      favoriteFormat: row.favorite_format,
      goal: row.goal,
      createdAt: row.created_at.toISOString(),
    };
  }

  const users = await readUsers();
  return users.find((user) => user.id === userId) ?? null;
}

export async function getUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (hasDatabase()) {
    await ensureUsersTable();
    const result = await getPool().query<{
      id: string;
      number: number;
      name: string;
      email: string;
      password_hash: string;
      favorite_format: string;
      goal: string;
      created_at: Date;
    }>(
      `
        SELECT
          id,
          number,
          name,
          email,
          password_hash,
          favorite_format,
          goal,
          created_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [normalizedEmail],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      number: row.number,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      favoriteFormat: row.favorite_format,
      goal: row.goal,
      createdAt: row.created_at.toISOString(),
    };
  }

  const users = await readUsers();
  return users.find((user) => user.email === normalizedEmail) ?? null;
}

export async function getUsersCount() {
  if (hasDatabase()) {
    await ensureUsersTable();
    const result = await getPool().query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM users",
    );
    return Number(result.rows[0]?.count ?? "0");
  }

  const users = await readUsers();
  return users.length;
}

export type UserListItem = {
  id: string;
  name: string;
  favoriteFormat: string;
  goal: string;
  postsCount: number;
  isFollowing: boolean;
};

export async function searchUsers(currentUserId: string, query: string = ""): Promise<UserListItem[]> {
  if (!hasDatabase()) return [];
  await ensureUsersTable();

  const searchPattern = `%${query.trim().toLowerCase()}%`;

  const result = await getPool().query<{
    id: string;
    name: string;
    favorite_format: string;
    goal: string;
    posts_count: string;
    is_following: boolean;
  }>(
    `SELECT 
       u.id, u.name, u.favorite_format, u.goal,
       COALESCE(p.cnt, 0)::text AS posts_count,
       CASE WHEN f.follower_id IS NOT NULL THEN true ELSE false END AS is_following
     FROM users u
     LEFT JOIN (SELECT user_id, COUNT(*) AS cnt FROM posts GROUP BY user_id) p ON p.user_id = u.id
     LEFT JOIN follows f ON f.following_id = u.id AND f.follower_id = $1
     WHERE u.id <> $1
       AND ($2 = '' OR LOWER(u.name) LIKE $3)
     ORDER BY u.created_at DESC
     LIMIT 50`,
    [currentUserId, query.trim().toLowerCase(), searchPattern]
  );

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    favoriteFormat: row.favorite_format,
    goal: row.goal,
    postsCount: Number(row.posts_count),
    isFollowing: row.is_following,
  }));
}

export async function updateUserProfile(
  userId: string,
  updates: {
    name: string;
    favoriteFormat: string;
    goal: string;
  }
) {
  if (!hasDatabase()) {
    throw new Error("Database required");
  }
  await ensureUsersTable();

  const name = updates.name.trim();
  const favoriteFormat = updates.favoriteFormat.trim();
  const goal = updates.goal.trim();

  if (name.length < 2) {
    throw new Error("Имя должно быть не короче 2 символов");
  }
  if (!favoriteFormat) {
    throw new Error("Выбери формат тренировок");
  }

  await getPool().query(
    `UPDATE users SET name = $1, favorite_format = $2, goal = $3 WHERE id = $4`,
    [name, favoriteFormat, goal, userId]
  );

  await getPool().query(
    `UPDATE posts SET author_name = $1 WHERE user_id = $2`,
    [name, userId]
  );

  await getPool().query(
    `UPDATE comments SET author_name = $1 WHERE user_id = $2`,
    [name, userId]
  );
}
export async function getUserStreak(userId: string): Promise<{
  current: number;
  best: number;
  weekDays: boolean[];
}> {
  if (!hasDatabase()) return { current: 0, best: 0, weekDays: [false, false, false, false, false, false, false] };

  const result = await getPool().query<{ entry_date: Date }>(
    `SELECT DISTINCT entry_date 
     FROM step_entries 
     WHERE user_id = $1 
     ORDER BY entry_date DESC`,
    [userId]
  );

  if (result.rows.length === 0) {
    return { current: 0, best: 0, weekDays: [false, false, false, false, false, false, false] };
  }

  const dates = result.rows.map(r => {
    const d = new Date(r.entry_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const datesSet = new Set(dates);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const yesterdayMs = todayMs - 86400000;
  const oneDay = 86400000;

  let current = 0;
  if (dates[0] === todayMs || dates[0] === yesterdayMs) {
    current = 1;
    let expectedNext = dates[0] - oneDay;
    for (let i = 1; i < dates.length; i++) {
      if (dates[i] === expectedNext) {
        current++;
        expectedNext -= oneDay;
      } else {
        break;
      }
    }
  }

  let best = 1;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dates[i - 1] - dates[i] === oneDay) {
      streak++;
      if (streak > best) best = streak;
    } else {
      streak = 1;
    }
  }
  if (current > best) best = current;

  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayMs = todayMs - mondayOffset * oneDay;

  const weekDays: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const dayMs = mondayMs + i * oneDay;
    if (dayMs > todayMs) {
      weekDays.push(false);
    } else {
      weekDays.push(datesSet.has(dayMs));
    }
  }

  return { current, best, weekDays };
}

export async function getActivityHeatmap(userId: string): Promise<Record<string, number>> {
  if (!hasDatabase()) return {};

  const result = await getPool().query<{ entry_date: Date; total: string }>(
    `SELECT entry_date, SUM(steps)::text AS total
     FROM step_entries
     WHERE user_id = $1 
       AND entry_date >= CURRENT_DATE - INTERVAL '365 days'
     GROUP BY entry_date
     ORDER BY entry_date ASC`,
    [userId]
  );

  const heatmap: Record<string, number> = {};
  for (const row of result.rows) {
    const date = new Date(row.entry_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    heatmap[key] = Number(row.total);
  }

  return heatmap;
}

export async function getWeeklyProgress(userId: string): Promise<{
  weeks: { label: string; total: number; startDate: string }[];
}> {
  if (!hasDatabase()) return { weeks: [] };

  const result = await getPool().query<{
    week_start: Date;
    total: string;
  }>(
    `SELECT 
       DATE_TRUNC('week', entry_date)::date AS week_start,
       SUM(steps)::text AS total
     FROM step_entries
     WHERE user_id = $1 
       AND entry_date >= CURRENT_DATE - INTERVAL '84 days'
     GROUP BY week_start
     ORDER BY week_start ASC`,
    [userId]
  );

  const weeksMap = new Map<string, number>();
  for (const row of result.rows) {
    const key = row.week_start.toISOString().slice(0, 10);
    weeksMap.set(key, Number(row.total));
  }

  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - todayOffset);
  currentMonday.setHours(0, 0, 0, 0);

  const weeks: { label: string; total: number; startDate: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() - i * 7);
    const key = weekStart.toISOString().slice(0, 10);
    const total = weeksMap.get(key) ?? 0;

    const day = weekStart.getDate();
    const month = weekStart.getMonth() + 1;
    const label = `${day}.${String(month).padStart(2, "0")}`;

    weeks.push({ label, total, startDate: key });
  }

  return { weeks };
}
