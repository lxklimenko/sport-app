import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
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
      <div className="min-h-screen bg-bg-main text-text-primary pb-24">

        {userId ? (
          <TopHeader />
        ) : (
          <nav className="fixed top-0 inset-x-0 z-50 glass-panel px-5 py-4 flex items-center justify-between pt-[calc(env(safe-area-inset-top)+1rem)]">
            <span className="text-lg font-semibold tracking-tight">Discipline</span>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full bg-bg-nested text-text-primary text-sm font-medium active-scale"
            >
              Войти
            </Link>
          </nav>
        )}

        {/* Hero */}
        <section className={`px-5 max-w-2xl mx-auto ${userId ? "pt-6" : "pt-32"}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-accent text-xs font-semibold tracking-wide uppercase">
              {challenges.length} {challenges.length === 1 ? "активный челлендж" : "активных"} · {totalParticipants} участников
            </span>
          </div>

          <h1 className="text-5xl font-bold tracking-[-0.04em] leading-[1.08] mb-5">
            Стань первым.<br />
            <span className="text-text-muted">Каждый день.</span>
          </h1>

          <p className="text-text-muted text-lg leading-relaxed mb-8 max-w-sm">
            Выбирай челлендж, тренируйся и доказывай результат.
          </p>

          <div className="flex items-center gap-3">
            <HapticLink
              href={userId ? "#challenges" : "/signup"}
              className="flex items-center gap-2 px-6 py-3.5 bg-accent text-black font-semibold rounded-full text-sm active-scale"
            >
              Начать
              <ArrowRight className="w-4 h-4" />
            </HapticLink>
            <div className="px-6 py-3.5 rounded-full border border-border-thin text-text-muted text-sm">
              Сезон Q2 2026
            </div>
          </div>
        </section>

        {/* Challenges */}
        <section id="challenges" className="mt-16 px-5 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold tracking-tight mb-4">Челленджи</h2>

          {challenges.length === 0 ? (
            <div className="card-base p-8 text-center text-text-muted">
              Пока нет активных челленджей
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {mainWithCount && (
                <Link
                  href={`/challenge/${mainWithCount.id}`}
                  className="card-base p-6 flex items-center justify-between active-scale"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl">
                      {mainWithCount.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold tracking-tight">{mainWithCount.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">Активен</span>
                      </div>
                      <p className="text-text-muted text-sm">{mainWithCount.participants} участников · {mainWithCount.days} дней</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
                </Link>
              )}

              {otherWithCounts.map((c) => (
                <Link
                  key={c.id}
                  href={`/challenge/${c.id}`}
                  className="card-base p-6 flex items-center justify-between active-scale"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-bg-nested flex items-center justify-center text-2xl">
                      {c.emoji}
                    </div>
                    <div>
                      <p className="font-semibold tracking-tight mb-0.5">{c.title}</p>
                      <p className="text-text-muted text-sm">{c.participants} участников · {c.days} дней</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Leaderboard */}
        <section className="mt-10 px-5 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold tracking-tight mb-4">Зал славы</h2>

          {!mainChallenge || leaders.length === 0 ? (
            <div className="card-base p-8 text-center text-text-muted text-sm">
              {!mainChallenge ? "Нет активных челленджей" : "Пока никто не добавил результаты"}
            </div>
          ) : (
            <div className="card-base overflow-hidden">
              {leaders.map((leader, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div
                    key={leader.userId}
                    className={`flex items-center justify-between px-5 py-4 ${i < leaders.length - 1 ? "border-b border-border-thin" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{medals[i]}</span>
                      <span className="font-medium text-sm">{leader.userName}</span>
                    </div>
                    <span className="text-text-muted text-sm font-medium">
                      {leader.totalSteps.toLocaleString()} {mainChallenge.unitLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        {!userId && (
          <section className="mt-16 px-5 max-w-2xl mx-auto">
            <div className="card-base p-8 flex flex-col items-center text-center gap-4">
              <p className="text-text-muted text-sm">Готов к соревнованию?</p>
              <HapticLink
                href="/signup"
                className="flex items-center gap-2 px-8 py-3.5 bg-accent text-black font-semibold rounded-full text-sm active-scale"
              >
                Создать аккаунт
                <ArrowRight className="w-4 h-4" />
              </HapticLink>
            </div>
          </section>
        )}

      </div>
    </HomeClient>
  );
}
