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
