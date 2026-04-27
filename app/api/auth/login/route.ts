import { NextRequest } from "next/server";
import { getUserByEmail, verifyPassword } from "@/lib/users";
import { signJwt } from "@/lib/jwt";
import { ok, err } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ status: "API is working, use POST to login" });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid JSON");

  const { email, password } = body;
  if (!email || !password) return err("Email и пароль обязательны");

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return err("Неверный email или пароль", 401);
  }

  const token = await signJwt(user.id);
  return ok({ token, user: { id: user.id, name: user.name, email: user.email, favoriteFormat: user.favoriteFormat, goal: user.goal } });
}
