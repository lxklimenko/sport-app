import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Trophy, Footprints } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import {
  addStepsAction,
  joinChallengeAction,
} from "@/app/actions";
import {
  getChallengeById,
  getLeaderboard,
  getMyStats,
  getParticipantsCount,
  isParticipant,
} from "@/lib/challenges";

export const dynamic = "force-dynamic";

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const challenge = await getChallengeById(id);
  if (!challenge) {
    notFound();
  }

  const userId = await getSessionUserId();
  const participantsCount = await getParticipantsCount(challenge.id);
  const leaders = await getLeaderboard(challenge.id, 10);
  const joined = userId ? await isParticipant(userId, challenge.id) : false;
  const stats = userId && joined ? await getMyStats(userId, challenge.id) : null;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000)
  );
  const progress = Math.min(
    100,
    Math.round(((challenge.days - daysLeft) / challenge.days) * 100)
  );

  const unit = challenge.unitLabel;

  return (
    <main className="min-h-screen bg-[#0D0F12] px-6 py-6 text-[#F5F7FA]">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#9AA0A6] hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <section className="rounded-[2rem] bg-[#C4EEDB] text-[#003829] p-8 lg:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-6xl mb-4">{challenge.emoji}</div>
              <h1 className="text-4xl lg:text-6xl font-semibold mb-3">
                {challenge.title}
              </h1>
              <p className="text-lg opacity-80 max-w-2xl">
                {challenge.description}
              </p>
            </div>
            <div className="rounded-full bg-[#003829]/10 px-4 py-2 text-sm font-bold whitespace-nowrap">
              {challenge.isActive ? "Активен" : "Завершён"}
            </div>
          </div>

          <div className="mt-8 h-3 rounded-full bg-[#003829]/15">
            <div
              className="h-3 rounded-full bg-[#003829]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-semibold">{daysLeft}</div>
              <div className="text-sm opacity-70">осталось дней</div>
            </div>
            <div>
              <div className="text-3xl font-semibold">{challenge.days}</div>
              <div className="text-sm opacity-70">всего дней</div>
            </div>
            <div>
              <div className="text-3xl font-semibold">{participantsCount}</div>
              <div className="text-sm opacity-70">участников</div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-[#171A1F] p-6 lg:p-8">
          {!userId ? (
            <div className="text-center py-4">
              <p className="text-lg text-[#C4C7C5] mb-4">
                Войди чтобы вступить в челлендж
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-[#A8C7FA] px-6 py-3 font-semibold text-[#062E6F] hover:bg-[#BBD6FE] transition"
              >
                Зарегистрироваться
              </Link>
            </div>
          ) : !joined ? (
            <div className="text-center py-4">
              <p className="text-lg text-[#C4C7C5] mb-4">
                Ты ещё не в этом челлендже
              </p>
              <form action={joinChallengeAction}>
                <input type="hidden" name="challengeId" value={challenge.id} />
                <button
                  type="submit"
                  className="rounded-full bg-[#C4EEDB] px-6 py-3 font-semibold text-[#062E2B] hover:bg-[#D8F6E9] transition cursor-pointer"
                >
                  Вступить
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Footprints className="w-5 h-5 text-[#C4EEDB]" />
                <h2 className="text-2xl font-semibold">Моя статистика</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="rounded-[1.4rem] bg-black/20 p-4">
                  <div className="text-sm text-[#9AA0A6]">Всего {unit}</div>
                  <div className="mt-2 text-3xl font-semibold">
                    {stats?.totalSteps.toLocaleString("ru-RU") ?? 0}
                  </div>
                </div>
                <div className="rounded-[1.4rem] bg-black/20 p-4">
                  <div className="text-sm text-[#9AA0A6]">Позиция</div>
                  <div className="mt-2 text-3xl font-semibold">
                    #{stats?.rank ?? "—"}
                  </div>
                </div>
                <div className="rounded-[1.4rem] bg-black/20 p-4">
                  <div className="text-sm text-[#9AA0A6]">Из участников</div>
                  <div className="mt-2 text-3xl font-semibold">
                    {stats?.totalParticipants ?? 0}
                  </div>
                </div>
              </div>

              <form action={addStepsAction} className="flex gap-3 flex-col md:flex-row">
                <input type="hidden" name="challengeId" value={challenge.id} />
                <input
                  name="steps"
                  type="number"
                  min="1"
                  max={challenge.dailyLimit}
                  required
                  placeholder={`Сколько ${unit} сегодня? (до ${challenge.dailyLimit})`}
                  className="flex-1 rounded-full bg-black/20 border border-white/10 px-6 py-4 text-lg text-white placeholder-[#9AA0A6] outline-none focus:border-[#C4EEDB]"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#C4EEDB] px-8 py-4 font-semibold text-[#062E2B] hover:bg-[#D8F6E9] transition cursor-pointer"
                >
                  Добавить
                </button>
              </form>
            </>
          )}
        </section>

        <section className="mt-6 rounded-[2rem] bg-[#171A1F] p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-5 h-5 text-[#FDE293]" />
            <h2 className="text-2xl font-semibold">Рейтинг участников</h2>
          </div>

          {leaders.length === 0 ? (
            <div className="text-center py-10 text-[#9AA0A6]">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Пока никто не добавил результаты</p>
              <p className="text-sm mt-2 opacity-70">Стань первым!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaders.map((leader, i) => {
                const isMe = leader.userId === userId;
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

                return (
                  <div
                    key={leader.userId}
                    className={`flex items-center gap-4 rounded-full px-5 py-4 transition ${
                      isMe
                        ? "bg-[#A8C7FA]/15 border border-[#A8C7FA]/30"
                        : i < 3
                        ? "bg-white/5"
                        : "bg-white/2"
                    }`}
                  >
                    <div className="w-8 text-center">
                      {medal ? (
                        <span className="text-2xl">{medal}</span>
                      ) : (
                        <span className="text-[#9AA0A6] font-semibold">
                          {i + 1}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold">
                        {leader.userName}
                        {isMe && (
                          <span className="ml-2 text-sm text-[#A8C7FA]">
                            это ты
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {leader.totalSteps.toLocaleString("ru-RU")}
                      </div>
                      <div className="text-xs text-[#9AA0A6]">{unit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}