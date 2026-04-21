import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getAllTeams, getMyTeam } from "@/lib/teams";
import { TopHeader } from "@/app/top-header";
import { createTeamAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const teams = await getAllTeams();
  const myTeam = await getMyTeam(userId);

  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-20">
      <TopHeader />

      <div className="px-4 py-3 border-b border-white/5">
        <h1 className="font-semibold text-lg">Команды</h1>
      </div>

      <div className="mx-auto max-w-2xl p-4">

        {!myTeam && (
          <details className="bg-[#1E1F22] rounded-2xl p-4 mb-4">
            <summary className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
              <Plus className="w-4 h-4" />
              Создать свою команду
            </summary>

            <form action={createTeamAction} className="mt-4 space-y-3">
              <div className="flex gap-2">
                <input
                  name="emoji"
                  defaultValue="🏁"
                  maxLength={2}
                  className="w-16 bg-black/30 rounded-xl px-3 py-2 text-center text-xl outline-none focus:ring-1 focus:ring-[#A8C7FA]"
                />
                <input
                  name="name"
                  required
                  minLength={3}
                  maxLength={40}
                  placeholder="Название команды"
                  className="flex-1 bg-black/30 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#A8C7FA] placeholder-[#9AA0A6]"
                />
              </div>
              <textarea
                name="description"
                rows={2}
                maxLength={200}
                placeholder="Короткое описание (необязательно)"
                className="w-full resize-none bg-black/30 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#A8C7FA] placeholder-[#9AA0A6]"
              />
              <button
                type="submit"
                className="w-full bg-[#A8C7FA] text-[#062E6F] py-2 rounded-xl font-semibold text-sm hover:bg-[#BBD6FE] transition"
              >
                Создать команду
              </button>
            </form>
          </details>
        )}

        {teams.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-[#1E1F22] flex items-center justify-center mx-auto mb-5">
              <Users className="w-9 h-9 text-[#9AA0A6]" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Команд пока нет</h2>
            <p className="text-[#9AA0A6] text-sm">Будь первым — создай свою!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {teams.map(team => {
              const isMyTeam = myTeam?.id === team.id;
              return (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition ${
                    isMyTeam ? "bg-[#A8C7FA]/10" : "bg-[#1E1F22] hover:bg-[#2A2D33]"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#2A2D33] flex items-center justify-center text-2xl shrink-0">
                    {team.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {team.name}
                      {isMyTeam && (
                        <span className="ml-2 text-xs text-[#A8C7FA]">твоя</span>
                      )}
                    </div>
                    {team.description && (
                      <div className="text-xs text-[#9AA0A6] truncate">
                        {team.description}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[#9AA0A6] shrink-0">
                    {team.memberCount} {team.memberCount === 1 ? "участник" : "участников"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}