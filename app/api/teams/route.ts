import { NextRequest } from "next/server";
import { getAllTeams, createTeam, getMyTeam } from "@/lib/teams";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);
  const [teams, myTeam] = await Promise.all([getAllTeams(), getMyTeam(userId)]);
  return ok({ teams, myTeamId: myTeam?.id ?? null });
}

export async function POST(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body?.name) return err("name обязателен");

  const team = await createTeam({ name: body.name, emoji: body.emoji ?? "🏆", description: body.description ?? "", userId });
  return ok(team, 201);
}
