"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getPool, migrateDatabase } from "@/lib/db";
import { getSession } from "@/lib/session";

export type AuthState = {
  error?: string;
};

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) return { error: "Заполни все поля" };
  if (password.length < 8) return { error: "Пароль минимум 8 символов" };

  await migrateDatabase();
  const db = getPool();

  const exists = await db.query("SELECT id FROM users WHERE email = $1", [email]);
  if (exists.rows.length > 0) return { error: "Эта почта уже используется" };

  const hash = await bcrypt.hash(password, 12);
  const result = await db.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
    [name, email, hash]
  );

  const session = await getSession();
  session.userId = result.rows[0].id;
  session.name = name;
  await session.save();

  redirect("/profile");
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Заполни все поля" };

  await migrateDatabase();
  const db = getPool();

  const result = await db.query(
    "SELECT id, name, password_hash FROM users WHERE email = $1",
    [email]
  );
  if (result.rows.length === 0) return { error: "Неверная почта или пароль" };

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return { error: "Неверная почта или пароль" };

  const session = await getSession();
  session.userId = user.id;
  session.name = user.name;
  await session.save();

  redirect("/profile");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
