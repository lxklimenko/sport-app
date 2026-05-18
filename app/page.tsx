"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { LiveFeed } from "./live-feed";
import { EventCard } from "@/components/event-card";
import { DisciplineModal } from "@/components/discipline-modal";
import { TopStatusBar } from "@/components/top-status-bar";
import { Skull, Trophy, Zap, Clock, Shield, AlertTriangle, ChevronRight, Flame, TrendingDown, Activity } from "lucide-react";
import type { FeedItem } from "@/lib/feed";
import type { SeasonEvent } from "@/lib/events";

// ─── types ───────────────────────────────────────────────────────────────────

interface WorldData {
  eliminated: number;
  top3Entries: string[];
  newEvents: { title: string; emoji: string | null }[];
  activeNow: number;
  overtakes: string[];
  totalUsers: number;
  totalDisciplines: number;
  seasonDay: number;
  notMetTarget: number;
  eventsActive: number;
}

interface SessionInfo {
  userId: string | null;
  name: string | null;
  inSeason: boolean;
  joinedIds: string[];
  survival: {
    total_survived: number;
    current_streak: number;
    alive_disciplines: number;
  };
  todayValue: number;
  todayTarget: number;
  danger: "dead" | "danger" | "warning" | "safe";
  userRank: number | null;
  totalPlayers: number;
  rivalsBeaten: number;
}

// ─── Time of day ─────────────────────────────────────────────────────────────

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

const TIME_CONFIG: Record<TimeOfDay, {
  title: string;
  subtitle: string;
  glow: string;
  accent: string;
  heroBg: string;
}> = {
  morning: {
    title: "НОВЫЙ ДЕНЬ НАЧАЛСЯ",
    subtitle: "Ночь забрала слабых. Ты всё ещё здесь.",
    glow: "bg-amber-400/[0.06]",
    accent: "text-amber-300",
    heroBg: "bg-white/[0.02]",
  },
  afternoon: {
    title: "ТЫ ПОКА ДЕРЖИШЬСЯ",
    subtitle: "Середина дня. Кто-то уже выдохся, кто-то только начинает.",
    glow: "bg-white/[0.02]",
    accent: "text-white/40",
    heroBg: "bg-white/[0.015]",
  },
  evening: {
    title: "ДО ВЫЛЕТА ОСТАЛОСЬ",
    subtitle: "Вечер. Норма закрыта не у всех. Каждая минута решает.",
    glow: "bg-orange-500/[0.06]",
    accent: "text-orange-300",
    heroBg: "bg-orange-500/[0.02]",
  },
  night: {
    title: "НОЧЬ РЕШАЕТ ВСЁ",
    subtitle: "Пока город спит — сезон не спит. Кто не записал — вылетает.",
    glow: "bg-indigo-500/[0.06]",
    accent: "text-indigo-300",
    heroBg: "bg-indigo-500/[0.02]",
  },
};

// ─── WorldStatus component ───────────────────────────────────────────────────

function WorldStatus({ world }: { world: WorldData | null }) {
  if (!world) return null;

  const hasNews = world.eliminated > 0 || world.top3Entries.length > 0 || world.newEvents.length > 0 || world.overtakes.length > 0;
  if (!hasNews) return null;

  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300/70">
          Пока тебя не было
        </p>
      </div>

      <div className="rounded-[22px] border border-orange-900/20 bg-orange-950/10 overflow-hidden">
        {world.eliminated > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-orange-900/10">
            <div className="w-8 h-8 rounded-xl border border-red-900/30 bg-red-950/20 flex items-center justify-center shrink-0">
              <Skull className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-[13px] text-white/70">
              <span className="font-semibold text-red-300">{world.eliminated}</span>{" "}
              {world.eliminated === 1 ? "игрок вылетел" : "игроков вылетели"}
            </p>
          </div>
        )}

        {world.top3Entries.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-orange-900/10">
            <div className="w-8 h-8 rounded-xl border border-emerald-900/30 bg-emerald-950/20 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[13px] text-white/70">
              {world.top3Entries.join(", ")} {world.top3Entries.length === 1 ? "вошёл" : "вошли"} в TOP 3
            </p>
          </div>
        )}

        {world.newEvents.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-orange-900/10">
            <div className="w-8 h-8 rounded-xl border border-blue-900/30 bg-blue-950/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-[13px] text-white/70">
              {world.newEvents.map((e) => `${e.emoji ?? "📅"} ${e.title}`).join(", ")} — присоединяйся
            </p>
          </div>
        )}

        {world.overtakes.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-xl border border-orange-900/30 bg-orange-950/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-[13px] text-white/70">
              {world.overtakes[0]}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Danger indicator ───────────────────────────────────────────────────────

function DangerBadge({ level }: { level: "dead" | "danger" | "warning" | "safe" }) {
  if (level === "safe") return null;

  const config = {
    dead: { icon: "💀", text: "Мёртвая зона", color: "text-[#FFB4AB]", border: "border-[#FFB4AB]/30", bg: "bg-[#FFB4AB]/[0.08]" },
    danger: { icon: "⚠️", text: "Под угрозой", color: "text-orange-300", border: "border-orange-500/20", bg: "bg-orange-500/[0.06]" },
    warning: { icon: "⚡", text: "Почти норма", color: "text-yellow-300", border: "border-yellow-500/20", bg: "bg-yellow-500/[0.06]" },
  }[level];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${config.border} ${config.bg}`}>
      <span className="text-[11px]">{config.icon}</span>
      <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${config.color}`}>{config.text}</span>
    </div>
  );
}

// ─── Ambient world indicator ────────────────────────────────────────────────

function AmbientIndicator({ world }: { world: WorldData | null }) {
  if (!world) return null;

  return (
    <div className="flex items-center gap-3 mb-5 text-[10px] text-white/20">
      <div className="flex items-center gap-1">
        <Activity className="w-3 h-3" />
        <span>{world.activeNow} online</span>
      </div>
      <span>·</span>
      <span>{world.totalUsers.toLocaleString("ru")} в сезоне</span>
      {world.eventsActive > 0 && (
        <>
          <span>·</span>
          <span className="text-orange-300/40">{world.eventsActive} события live</span>
        </>
      )}
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [events, setEvents] = useState<SeasonEvent[]>([]);
  const [world, setWorld] = useState<WorldData | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());

  const fetchData = useCallback(async () => {
    try {
      const [feedRes, eventsRes, worldRes, sessionRes] = await Promise.all([
        fetch("/api/feed"),
        fetch("/api/events/live"),
        fetch("/api/world"),
        fetch("/api/session"),
      ]);
      if (feedRes.ok) {
        const data: FeedItem[] = await feedRes.json();
        setFeed(data);
      }
      if (eventsRes.ok) {
        const data: SeasonEvent[] = await eventsRes.json();
        setEvents(data);
      }
      if (worldRes.ok) {
        const data: WorldData = await worldRes.json();
        setWorld(data);
      }
      if (sessionRes.ok) {
        const data: SessionInfo = await sessionRes.json();
        setSession(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 60000);
    return () => clearInterval(interval);
  }, []);

  const totalUsers = world?.totalUsers ?? 0;
  const activeNow = world?.activeNow ?? 0;
  const seasonDay = world?.seasonDay ?? 1;
  const totalDisciplines = world?.totalDisciplines ?? 0;
  const notMetTarget = world?.notMetTarget ?? 0;
  const daysLeft = 30 - seasonDay;

  const isLoggedIn = session?.userId;
  const inSeason = session?.inSeason ?? false;

  const timeConfig = TIME_CONFIG[timeOfDay];

  // ── LOGGED IN + IN SEASON: Survival Command Center ──────────────────────
  if (isLoggedIn && inSeason && session) {
    const isRed = session.danger === "dead" || session.danger === "danger";

    return (
      <main className="min-h-screen bg-[#050505] text-white overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl transition-all duration-1000 ${isRed ? "bg-[#FFB4AB]/[0.06]" : timeConfig.glow}`} />
          <div className="absolute bottom-[-200px] right-[-80px] w-[400px] h-[400px] rounded-full blur-3xl bg-orange-500/[0.04]" />
        </div>

        <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-28">

          {/* TOP STATUS BAR */}
          <TopStatusBar
            seasonDay={seasonDay}
            daysLeft={daysLeft}
            danger={session.danger}
            userName={session.name}
            activeNow={activeNow}
          />

          {/* TIME OF DAY HERO */}
          <section className="mb-5 rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${timeConfig.accent}`}>
                  {timeConfig.title}
                </p>
                <p className="mt-1 text-[12px] text-white/35 leading-relaxed max-w-[260px]">
                  {timeConfig.subtitle}
                </p>
              </div>
              <div className="text-[28px] leading-none">
                {timeOfDay === "morning" && "🌅"}
                {timeOfDay === "afternoon" && "☀️"}
                {timeOfDay === "evening" && "🌆"}
                {timeOfDay === "night" && "🌙"}
              </div>
            </div>
          </section>

          {/* AMBIENT INDICATOR */}
          <AmbientIndicator world={world} />

          {/* HERO — survival status */}
          <section className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-1">
                  Твой статус
                </p>
                <h2 className="text-[42px] leading-[0.88] tracking-[-0.05em] font-semibold text-[#F5F5F5]">
                  {session.survival.total_survived} дней
                </h2>
              </div>
              <DangerBadge level={session.danger} />
            </div>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-[11px] text-white/60 font-medium">{session.survival.current_streak} дней подряд</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                <Shield className="w-3 h-3 text-white/40" />
                <span className="text-[11px] text-white/60 font-medium">{session.survival.alive_disciplines} живы</span>
              </div>
            </div>
          </section>

          {/* SEASON PROGRESS */}
          <section className="mb-5">
            <Link href="/season/current" className="block rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4 active:scale-[0.99] transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">Прогресс сезона</p>
                <span className="text-[11px] text-white/40">{daysLeft} дней осталось</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                <div className="h-full rounded-full bg-white/40 transition-all" style={{ width: `${Math.round((seasonDay / 30) * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/50">День {seasonDay} из 30</span>
                <span className="text-[12px] text-white/30">Ты пережил {session.rivalsBeaten.toLocaleString("ru")} игроков</span>
              </div>
            </Link>
          </section>

          {/* DANGER / PRESSURE */}
          {isRed && (
            <section className="mb-5">
              <div className="rounded-[22px] border border-[#FFB4AB]/15 bg-[#FFB4AB]/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl border border-[#FFB4AB]/20 bg-[#FFB4AB]/[0.08] flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-[#FFB4AB]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white leading-tight">
                      {session.danger === "dead"
                        ? "Ты ещё ничего не записал сегодня"
                        : "Ты под угрозой вылета"}
                    </p>
                    <p className="mt-1 text-[12px] text-white/35 leading-relaxed">
                      {session.danger === "dead"
                        ? `${session.totalPlayers - (session.userRank ?? 1)} человек уже впереди. Каждый час — это места в рейтинге.`
                        : `Осталось ${session.todayTarget - session.todayValue} до нормы. Запиши результат сейчас.`}
                    </p>
                    <Link
                      href={`/record?d=${session.joinedIds[0] ?? "steps"}`}
                      className="mt-3 inline-flex h-9 px-4 rounded-xl bg-[#FFB4AB] text-[#1a0808] text-[12px] font-semibold items-center gap-1 active:scale-[0.97] transition-all"
                    >
                      Записать результат <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* WORLD STATUS */}
          <WorldStatus world={world} />

          {/* LIVE EVENTS */}
          {events.length > 0 && (
            <section className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">События</p>
                <span className="text-[10px] text-white/20">LIVE</span>
              </div>
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.018] overflow-hidden">
                {events.map((e) => (
                  <EventCard
                    key={e.id}
                    id={e.id}
                    title={e.title}
                    emoji={e.emoji}
                    discipline={e.discipline}
                    starts_at={e.starts_at}
                    ends_at={e.ends_at}
                    joined={false}
                    participant_count={(e as any).participant_count}
                    alive_count={(e as any).alive_count}
                    eliminated_count={(e as any).eliminated_count}
                  />
                ))}
              </div>
            </section>
          )}

          {/* LIVE FEED */}
          <LiveFeed items={feed} />

          {/* QUICK ACTIONS */}
          <section className="mt-5 grid grid-cols-2 gap-2.5">
            <Link
              href="/season/current"
              className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-4 text-center active:scale-[0.98] transition-all"
            >
              <span className="text-[22px]">⚔️</span>
              <p className="mt-1 text-[12px] font-semibold text-white/70">Сезон</p>
              <p className="text-[10px] text-white/30 mt-0.5">Рейтинг и соперники</p>
            </Link>
            <Link
              href="/pulse"
              className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-4 text-center active:scale-[0.98] transition-all"
            >
              <span className="text-[22px]">📡</span>
              <p className="mt-1 text-[12px] font-semibold text-white/70">Пульс</p>
              <p className="text-[10px] text-white/30 mt-0.5">Лента сезона</p>
            </Link>
          </section>

        </div>
      </main>
    );
  }

  // ── LOGGED IN BUT NOT IN SEASON ─────────────────────────────────────────
  if (isLoggedIn && !inSeason) {
    return (
      <main className="min-h-screen bg-[#050505] text-white overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-220px] left-1/2 -translate-x-1/2 w-[820px] h-[820px] bg-white/[0.03] rounded-full blur-3xl" />
          <div className="absolute bottom-[-320px] right-[-100px] w-[520px] h-[520px] bg-orange-500/[0.05] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-28">
          {/* TOP BAR */}
          <TopStatusBar
            seasonDay={seasonDay}
            daysLeft={daysLeft}
            userName={session?.name}
            activeNow={activeNow}
          />

          {/* HERO */}
          <section className="pt-8">
            <h1 className="text-[52px] leading-[0.9] tracking-[-0.06em] font-semibold text-[#F5F5F5]">
              Ты ещё
              <br />
              не внутри
            </h1>
            <p className="mt-4 text-[15px] text-white/40 leading-relaxed max-w-sm">
              {totalUsers.toLocaleString("ru")} игроков уже в сезоне.
              <br />
              Каждый день без тебя — их преимущество.
            </p>

            <Link
              href="/onboarding"
              className="mt-8 w-full h-13 rounded-[20px] bg-[#F3F3F3] text-black text-[14px] font-semibold flex items-center justify-center active:scale-[0.985] transition-all shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
            >
              ВОЙТИ В СЕЗОН
            </Link>
          </section>

          {/* AMBIENT INDICATOR */}
          <div className="mt-8">
            <AmbientIndicator world={world} />
          </div>

          {/* WORLD STATUS */}
          <div className="mt-5">
            <WorldStatus world={world} />
          </div>

          {/* LIVE FEED */}
          <LiveFeed items={feed} />
        </div>
      </main>
    );
  }

  // ── NOT LOGGED IN: Landing ──────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-220px] left-1/2 -translate-x-1/2 w-[820px] h-[820px] bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-[-320px] right-[-100px] w-[520px] h-[520px] bg-orange-500/[0.05] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-28">
        {/* TOP BAR */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.7)]" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/35 font-medium">
              СЕЗОН 1 АКТИВЕН
            </span>
          </div>
          <Link
            href="/login"
            className="h-10 px-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl text-sm text-white/65 inline-flex items-center justify-center active:scale-[0.98] transition-all"
          >
            Войти
          </Link>
        </header>

        {/* HERO */}
        <section className="pt-14">
          <div className="max-w-[420px]">
            <h1 className="text-[58px] sm:text-[68px] leading-[0.92] tracking-[-0.07em] font-semibold text-[#F5F5F5]">
              НЕ
              <br />
              СДАЙСЯ
            </h1>
            <p className="mt-5 text-[16px] leading-7 text-white/50 max-w-sm">
              Выбирай дисциплины.
              <br />
              Выживай каждый день.
              <br />
              Не дай себя обогнать.
            </p>
          </div>

          {/* LIVE STATUS */}
          <div className="mt-8">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.7)]" />
              <p className="text-sm text-white/60">
                {activeNow > 0 ? `${activeNow} сейчас в сезоне` : "Сезон активен"}
              </p>
            </div>
            <p className="mt-1.5 text-xs text-white/50 ml-[10px]">
              День {seasonDay} продолжается
            </p>
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/signup"
              className="w-full h-13 rounded-[20px] bg-[#F3F3F3] text-black text-[14px] font-semibold flex items-center justify-center active:scale-[0.985] transition-all shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
            >
              ВОЙТИ В СЕЗОН
            </Link>
            <p className="mt-3 text-[11px] text-white/25 text-center leading-relaxed">
              {notMetTarget > 0
                ? `${notMetTarget} человек ещё не выполнили норму сегодня`
                : "Ты можешь не успеть"}
            </p>
          </div>

          {/* STATS */}
          <div className="mt-8 flex items-center gap-6">
            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                {totalUsers > 0 ? totalUsers.toLocaleString("ru") : "—"}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/30">
                в сезоне
              </p>
            </div>
            <div className="w-px h-8 bg-white/[0.06]" />
            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                {daysLeft > 0 ? daysLeft : "—"}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/30">
                дней осталось
              </p>
            </div>
            <div className="w-px h-8 bg-white/[0.06]" />
            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                {totalDisciplines > 0 ? totalDisciplines : "—"}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/30">
                дисциплины
              </p>
            </div>
          </div>
        </section>

        {/* AMBIENT INDICATOR */}
        <div className="mt-8">
          <AmbientIndicator world={world} />
        </div>

        {/* WORLD STATUS */}
        <div className="mt-5">
          <WorldStatus world={world} />
        </div>

        {/* DISCIPLINES */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
              Дисциплины сезона
            </p>
            <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-white">
              Игроки уже внутри
            </h2>
          </div>

          <div className="space-y-2.5">
            {[
              { id: "steps", emoji: "👟", name: "Шаги", desc: "10 000 шагов каждый день", atRisk: "2 184 под угрозой", atRiskColor: "text-[#FFB4AB]" },
              { id: "running", emoji: "🏃", name: "Бег", desc: "Событие на 3 дня", atRisk: "482 уже вошли", atRiskColor: "text-orange-300" },
              { id: "burpees", emoji: "💥", name: "Бёрпи", desc: "Скоро откроется", atRisk: "Только для выживших", atRiskColor: "text-white/40" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDiscipline(d.id)}
                className="w-full text-left rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-3.5 transition-all active:scale-[0.99] hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-[20px] shrink-0">
                    {d.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold text-white leading-none">{d.name}</p>
                    <p className="mt-1 text-xs text-white/50">{d.desc}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-[11px] font-medium ${d.atRiskColor}`}>{d.atRisk}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* LIVE EVENTS */}
        {events.length > 0 && (
          <section className="mt-8">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
                События сейчас
              </p>
              <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-white">
                Присоединяйся
              </h2>
            </div>
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.018] overflow-hidden">
              {events.map((e) => (
                <EventCard
                  key={e.id}
                  id={e.id}
                  title={e.title}
                  emoji={e.emoji}
                  discipline={e.discipline}
                  starts_at={e.starts_at}
                  ends_at={e.ends_at}
                  joined={false}
                  participant_count={(e as any).participant_count}
                  alive_count={(e as any).alive_count}
                  eliminated_count={(e as any).eliminated_count}
                />
              ))}
            </div>
          </section>
        )}

        {/* LIVE FEED */}
        <LiveFeed items={feed} />
      </div>

      {/* DISCIPLINE MODAL */}
      {selectedDiscipline && (
        <DisciplineModal
          disciplineId={selectedDiscipline}
          onClose={() => setSelectedDiscipline(null)}
        />
      )}
    </main>
  );
}
