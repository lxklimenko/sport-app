import Link from "next/link";
import {
  ChevronRight,
  Zap,
  ArrowRight,
  Sun,
} from "lucide-react";
import { TopHeader } from "@/app/top-header";
import { HapticLink } from "@/app/haptic-link";
import { HomeClient } from "./home-client";

import { getSessionUserId } from "@/lib/auth";
import {
  getAllActiveChallenges,
  getLeaderboard,
  getParticipantsCount,
} from "@/lib/challenges";
import { getPool, hasDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getGlobalStats() {
  if (!hasDatabase()) return { totalParticipants: 0 };
  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(DISTINCT user_id)::text AS count FROM participants`
  );
  return { totalParticipants: Number(result.rows[0]?.count ?? 0) };
}

export default async function Home() {
  const userId = await getSessionUserId();
  const challenges = await getAllActiveChallenges();
  const { totalParticipants } = await getGlobalStats();

  const mainChallenge = challenges[0];

  const leaders = mainChallenge
    ? await getLeaderboard(mainChallenge.id, 3)
    : [];

  const challengesWithCounts = await Promise.all(
    challenges.map(async (c) => ({
      ...c,
      participants: await getParticipantsCount(c.id),
    }))
  );

  const mainWithCount = challengesWithCounts[0];
  const otherWithCounts = challengesWithCounts.slice(1);

  return (
    <HomeClient>
      <div className="min-h-screen bg-[#131314] text-[#E3E3E3] font-sans pb-20">

        {userId ? (
          <TopHeader />
        ) : (
          <nav className="fixed top-4 inset-x-0 mx-auto w-[calc(100%-2rem)] max-w-7xl bg-[#1E1F22] rounded-full px-4 py-3 flex items-center justify-between z-50 shadow-lg">
            <div className="flex items-center gap-3 pl-2">
              <div className="w-8 h-8 rounded-full bg-[#A8C7FA] flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#062E6F]" fill="currentColor" />
              </div>
              <span className="font-medium text-lg">Discipline</span>
            </div>
            <Link
              href="/login"
              className="px-6 py-2 rounded-full bg-[#333537] hover:bg-[#444746] transition"
            >
              Войти
            </Link>
          </nav>
        )}

        <section className="pt-8 pb-20 px-6 max-w-4xl mx-auto">

          <div className="flex items-center gap-3 mb-10 text-[#C4C7C5] text-lg font-medium tracking-tight">
            <Sun className="w-6 h-6 text-[#FDE293]" fill="currentColor" />
            <span>
              {challenges.length} {challenges.length === 1 ? "активный челлендж" : "активных челленджа"} · {totalParticipants} участников
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[1.05] mb-8 text-white">
            Стань первым.<br />Каждый день.
          </h1>

          <p className="text-xl md:text-2xl text-[#C4C7C5] leading-relaxed mb-12 max-w-xl font-medium">
            Твоя дисциплина. Твой результат. Выбирай челлендж и докажи, что ты готов к победе.
          </p>

          <div className="flex flex-wrap gap-4">
            <HapticLink
              href={userId ? "#challenges" : "/signup"}
              className="px-8 py-5 bg-[#A8C7FA] text-[#062E6F] rounded-full flex items-center gap-3 text-lg hover:bg-[#BBD6FE] transition active:scale-95"
            >
              Выбрать челлендж
              <ArrowRight className="w-5 h-5" />
            </HapticLink>

            <div className="px-6 py-4 border border-[#444746] rounded-full">
              Сезон Q1
            </div>
          </div>
        </section>

        <section id="challenges" className="py-16 px-6 max-w-7xl mx-auto">
          <h2 className="text-3xl mb-10">Челленджи</h2>

          {challenges.length === 0 ? (
            <div className="text-center py-10 text-[#9AA0A6]">
              Пока нет активных челленджей
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">

              {mainWithCount && (
                <Link
                  href={`/challenge/${mainWithCount.id}`}
                  className="md:col-span-2 p-10 rounded-[2rem] bg-[#C4EEDB] text-[#003829] flex flex-col justify-between hover:bg-[#D5F5E4] transition cursor-pointer"
                >
                  <div>
                    <div className="text-5xl mb-4">{mainWithCount.emoji}</div>
                    <div className="mb-6 px-4 py-2 bg-[#003829]/10 rounded-full text-sm font-bold w-fit">
                      Активен сейчас
                    </div>

                    <h3 className="text-4xl mb-4">{mainWithCount.title}</h3>
                    <p className="text-lg opacity-80">
                      {mainWithCount.description || `${mainWithCount.days} дней`}
                    </p>
                  </div>

                  <div className="flex justify-between items-end mt-10">
                    <div>
                      <div className="text-3xl">{mainWithCount.participants}</div>
                      <div className="text-sm opacity-70">участников</div>
                    </div>

                    <div className="w-14 h-14 rounded-full bg-[#003829] text-white flex items-center justify-center">
                      <ChevronRight />
                    </div>
                  </div>
                </Link>
              )}

              {otherWithCounts.map((c) => (
                <Link
                  key={c.id}
                  href={`/challenge/${c.id}`}
                  className="p-8 rounded-[2rem] bg-[#1E1F22] hover:bg-[#282A2D] transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="text-4xl mb-4">{c.emoji}</div>
                    <h3 className="text-xl mb-2">{c.title}</h3>
                    <p className="text-[#C4C7C5] text-sm">{c.days} дней · {c.unitLabel}</p>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div>
                      <div className="text-2xl font-semibold">{c.participants}</div>
                      <div className="text-xs text-[#9AA0A6]">участников</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#9AA0A6]" />
                  </div>
                </Link>
              ))}

            </div>
          )}
        </section>

        <section className="py-20 px-6 max-w-3xl mx-auto">
          <h2 className="text-3xl mb-10">Зал славы</h2>

          {!mainChallenge ? (
            <div className="text-center py-10 text-[#C4C7C5]">
              Нет активных челленджей
            </div>
          ) : leaders.length === 0 ? (
            <div className="text-center py-10 text-[#C4C7C5]">
              <p className="text-lg">Пока никто не добавил результаты.</p>
              <p className="text-sm mt-2 opacity-70">Стань первым в рейтинге!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {leaders.map((leader, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
                const bgClass = i === 0
                  ? "bg-[#FDE293] text-black"
                  : "bg-[#1E1F22]";
                return (
                  <div
                    key={leader.userId}
                    className={`p-4 rounded-full flex justify-between items-center ${bgClass}`}
                  >
                    <span>{medal} {leader.userName}</span>
                    <span>{leader.totalSteps.toLocaleString()} {mainChallenge.unitLabel}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="py-20 flex justify-center">
          {!userId ? (
            <HapticLink
              href="/signup"
              className="px-12 py-6 bg-[#C4EEDB] text-black rounded-full flex items-center gap-4 hover:bg-[#D5F5E4] transition active:scale-95"
            >
              Начать
              <ArrowRight />
            </HapticLink>
          ) : (
            <HapticLink
              href="#challenges"
              className="px-12 py-6 bg-[#C4EEDB] text-black rounded-full flex items-center gap-4 hover:bg-[#D5F5E4] transition active:scale-95"
            >
              Выбрать челлендж
              <ArrowRight />
            </HapticLink>
          )}
        </section>

      </div>
    </HomeClient>
  );
}