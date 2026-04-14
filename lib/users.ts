import "server-only";

import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
  const users = await readUsers();
  const normalizedEmail = input.email.trim().toLowerCase();

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
  const users = await readUsers();
  return users.find((user) => user.id === userId) ?? null;
}

export async function getUsersCount() {
  const users = await readUsers();
  return users.length;
}
