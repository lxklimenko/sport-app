import { NextRequest } from "next/server";
import { getAllActiveChallenges, getParticipantsCount } from "@/lib/challenges";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const challenges = await getAllActiveChallenges();
  const withCounts = await Promise.all(
    challenges.map(async c => ({ ...c, participants: await getParticipantsCount(c.id) }))
  );
  return ok(withCounts);
}
