import { NextRequest } from "next/server";
import { joinTeam } from "@/lib/teams";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);
  const { id } = await params;
  await joinTeam(userId, id);
  return ok({ joined: true });
}
