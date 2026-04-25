import { NextRequest } from "next/server";
import { searchUsers } from "@/lib/users";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const users = await searchUsers(q, userId);
  return ok(users);
}
