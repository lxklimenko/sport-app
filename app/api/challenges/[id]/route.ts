import { NextRequest } from "next/server";
import { getChallengeById, getLeaderboard, getParticipantsCount, isParticipant, getMyStats, getMyChallenges } from "@/lib/challenges";
import { getTeamsRanking } from "@/lib/teams";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { id } = await params;
  const challenge = await getChallengeById(id);
  if (!challenge) return err("Not found", 404);

  const [leaders, teamsRanking, participantsCount, participating, myStats] = await Promise.all([
    getLeaderboard(id, 10),
    getTeamsRanking(id),
    getParticipantsCount(id),
    isParticipant(userId, id),
    getMyStats(userId, id),
  ]);

  return ok({ challenge, leaders, teamsRanking, participantsCount, participating, myStats });
}
