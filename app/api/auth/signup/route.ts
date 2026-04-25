import { NextRequest } from "next/server";
import { createUser, getUserByEmail } from "@/lib/users";
import { signJwt } from "@/lib/jwt";
import { ok, err } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid JSON");

  const { name, email, password, favoriteFormat, goal } = body;

  if (!name || !email || !password || !favoriteFormat) {
    return err("Все поля обязательны");
  }

  const existing = await getUserByEmail(email);
  if (existing) return err("Email уже используется", 409);

  const user = await createUser({ name, email, password, favoriteFormat, goal: goal ?? "" });
  const token = await signJwt(user.id);

  return ok({ token, user: { id: user.id, name: user.name, email: user.email, favoriteFormat: user.favoriteFormat, goal: user.goal } }, 201);
}
