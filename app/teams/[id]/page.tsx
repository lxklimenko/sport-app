import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut, Users } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getTeamById, getTeamMembers, getMyTeam } from "@/lib/teams";
import { getAllActiveChallenges } from "@/lib/challenges";
import { joinTeamAction, leaveTeamAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const team = await getTeamById(id);
  if (!team) notFound();

  const myTeam = await getMyTeam(userId);
  const isMyTeam = myTeam?.id === team.id;
  const canJoin = !myTeam;

  const activeChallenges = await getAllActiveChallenges();
  const primaryChallenge = activeChallenges[0];

  const members = primaryChallenge
    ? await getTeamMembers(team.id, primaryChallenge.id)
    : await getTeamMembers(team.id);

  const totalTeamSteps = members.reduce((sum, m) => sum + m.totalSteps, 0);

  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-20">

      <div className="sticky top-0 z-10 bg-[#0D0F12]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link
          href="/teams"
          className="p-2 -ml-2 hover:bg-white/5 rounded-full transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold">Команда</span>
      </div>

      <div className="mx-auto max-w-2xl p-4">

        <div className="bg-[#1E1F22] rounded-2xl p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#2A2D33] flex items-center justify-center text-4xl shrink-0">
              {team.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold mb-1">{team.name}</h1>
              {team.description && (
                <p className="text-sm text-[#C4C7C5] mb-2">{team.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-[#9AA0A6]">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {team.memberCount} {team.memberCount === 1 ? "участник" : "участников"}
                </span>
                {totalTeamSteps > 0 && primaryChallenge && (
                  <span>
                    🔥 {totalTeamSteps.toLocaleString("ru-RU")} {primaryChallenge.unitLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {canJoin && (
              <form action={joinTeamAction} className="flex-1">
                <input type="hidden" name="teamId" value={team.id} />
                <button
                  type="submit"
                  className="w-full bg-[#A8C7FA] text-[#062E6F] py-2 rounded-xl font-semibold text-sm hover:bg-[#BBD6FE] transition"
                >
                  Вступить в команду
                </button>
              </form>
            )}
            {isMyTeam && (
              <form action={leaveTeamAction} className="flex-1">
                <button
                  type="submit"
                  className="w-full bg-[#1E1F22] border border-white/10 text-[#FFB4AB] py-2 rounded-xl font-medium text-sm hover:bg-[#2A2D33] transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти из команды
                </button>
              </form>
            )}
            {!canJoin && !isMyTeam && (
              <div className="flex-1 text-center text-xs text-[#9AA0A6] py-2">
                Ты уже в другой команде
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1E1F22] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Состав команды</h2>
            {primaryChallenge && (
              <span className="text-xs text-[#9AA0A6]">
                {primaryChallenge.emoji} {primaryChallenge.title}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {members.map((member, i) => {
              const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.userName)}`;
              const isMe = member.userId === userId;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              return (
                <Link
                  key={member.userId}
                  href={isMe ? "/profile" : `/user/${member.userId}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition"
                >
                  <div className="w-6 text-center text-sm">
                    {medal ?? <span className="text-[#9AA0A6]">{i + 1}</span>}
                  </div>
                  <img
                    src={avatarUrl}
                    alt={member.userName}
                    className="w-10 h-10 rounded-full bg-[#2A2D33]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {member.userName}
                      {isMe && <span className="ml-2 text-xs text-[#A8C7FA]">ты</span>}
                    </div>
                  </div>
                  {primaryChallenge && member.totalSteps > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {member.totalSteps.toLocaleString("ru-RU")}
                      </div>
                      <div className="text-[10px] text-[#9AA0A6]">
                        {primaryChallenge.unitLabel}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}