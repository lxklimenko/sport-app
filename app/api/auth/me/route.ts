import { NextRequest } from "next/server";
import { getUserById } from "@/lib/users";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const user = await getUserById(userId);
  if (!user) return err("User not found", 404);

  return ok({ id: user.id, name: user.name, email: user.email, favoriteFormat: user.favoriteFormat, goal: user.goal });
}
