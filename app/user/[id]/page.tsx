import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Shield, Flame } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPool, migrateDatabase } from "@/lib/db";

const DISCIPLINE_META: Record<string, { emoji: string; name: string }> = {
  steps:   { emoji: "👟", name: "Шаги" },
  running: { emoji: "🏃", name: "Бег" },
  burpees: { emoji: "💥", name: "Бёрпи" },
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  // Redirect to own profile
  if (session.userId && session.userId === id) {
    const { redirect } = await import("next/navigation");
    redirect("/profile");
  }

  await migrateDatabase();
  const db = getPool();

  const [userRes, disciplinesRes, survivalRes, todayRes] = await Promise.all([
    db.query<{ id: string; name: string }>(
      "SELECT id, name FROM users WHERE id = $1",
      [id]
    ),
    db.query<{ discipline_id: string }>(
      "SELECT discipline_id FROM user_disciplines WHERE user_id = $1 ORDER BY joined_at",
      [id]
    ),
    db.query<{
      discipline_id: string;
      survived_days: number;
      current_streak: number;
      longest_streak: number;
      is_alive: boolean;
    }>(
      `SELECT discipline_id, survived_days, current_streak, longest_streak, is_alive
       FROM user_survival WHERE user_id = $1`,
      [id]
    ),
    db.query<{ discipline_id: string; total: string }>(
      `SELECT discipline_id, COALESCE(SUM(value), 0) AS total
       FROM activities
       WHERE user_id = $1 AND recorded_at::date = CURRENT_DATE
       GROUP BY discipline_id`,
      [id]
    ),
  ]);

  if (userRes.rows.length === 0) notFound();

  const user = userRes.rows[0];
  const disciplines = disciplinesRes.rows.map((r) => r.discipline_id);
  const survival = survivalRes.rows;
  const todayMap = Object.fromEntries(
    todayRes.rows.map((r) => [r.discipline_id, parseFloat(r.total)])
  );

  const initials = user.name.slice(0, 1).toUpperCase();
  const inSeason = disciplines.length > 0;

  const totalSurvived = survival.reduce((acc, s) => acc + s.survived_days, 0);
  const bestStreak = survival.reduce((acc, s) => Math.max(acc, s.longest_streak), 0);
  const aliveDisciplines = survival.filter((s) => s.is_alive).length;

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl bg-white/[0.03]" />
        <div className="absolute bottom-[-200px] right-[-80px] w-[400px] h-[400px] rounded-full blur-3xl bg-orange-500/[0.04]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-28">

        {/* TOP BAR */}
        <header className="flex items-center gap-3 mb-8">
          <Link
            href={session.userId ? "/season/current" : "/"}
            className="w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/35 font-medium">Игрок</span>
          </div>
        </header>

        {/* IDENTITY */}
        <section className="flex items-center gap-3.5 mb-8">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.08] flex items-center justify-center text-2xl font-bold text-white/60 select-none shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[22px] font-semibold tracking-tight leading-none">{user.name}</h1>
              {inSeason && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/[0.08]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-green-400">В сезоне</span>
                </span>
              )}
            </div>
          </div>
        </section>

        {/* SURVIVAL STATS */}
        {inSeason && (
          <section className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-3">Выживание</p>
            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-[14px]">🔥</span>
                    <span className="text-[20px] font-semibold text-white/90 tabular-nums">{totalSurvived}</span>
                  </div>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.08em]">дней</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[20px] font-semibold text-white/90 tabular-nums">{bestStreak}</span>
                  </div>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.08em]">серия</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Shield className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-[20px] font-semibold text-white/90 tabular-nums">{aliveDisciplines}</span>
                  </div>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.08em]">живы</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* DISCIPLINES */}
        {inSeason && (
          <section className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-3">Дисциплины</p>
            <div className="space-y-2.5">
              {disciplines.map((disciplineId) => {
                const meta = DISCIPLINE_META[disciplineId];
                const survivalData = survival.find((s) => s.discipline_id === disciplineId);
                const todayVal = todayMap[disciplineId] ?? 0;
                if (!meta) return null;
                return (
                  <div
                    key={disciplineId}
                    className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-[20px] shrink-0">
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-white leading-none">{meta.name}</p>
                        {survivalData && (
                          <p className="mt-1 text-[12px] text-white/40">
                            {survivalData.survived_days} {survivalData.survived_days < 5 ? "дня" : "дней"} выжил
                            {survivalData.current_streak > 0 && ` · 🔥 ${survivalData.current_streak}`}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {survivalData && (
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border ${survivalData.is_alive ? "border-green-500/20 bg-green-500/[0.06] text-green-400" : "border-red-500/20 bg-red-500/[0.06] text-red-400"}`}>
                            {survivalData.is_alive ? "Жив" : "Выбыл"}
                          </span>
                        )}
                      </div>
                    </div>
                    {todayVal > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/[0.04]">
                        <p className="text-[11px] text-white/30">Сегодня: <span className="text-white/60">{todayVal.toLocaleString("ru")}</span></p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!inSeason && (
          <section className="mb-6">
            <div className="rounded-[22px] border border-dashed border-white/[0.08] p-8 text-center">
              <p className="text-white/30 text-sm">Этот игрок ещё не в сезоне</p>
            </div>
          </section>
        )}

        {/* CTA — compare or record */}
        {session.userId && (
          <Link
            href="/season/current"
            className="w-full h-12 rounded-[20px] border border-white/[0.08] bg-white/[0.025] text-white/60 text-[13px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            Вернуться в сезон ⚔️
          </Link>
        )}

      </div>
    </main>
  );
}
