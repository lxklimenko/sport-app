"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LiveFeed } from "./live-feed";
import { EventCard } from "@/components/event-card";
import { AnimatedCounter } from "@/components/animated-counter";
import { Skull, Trophy, Zap, Clock, Activity, Flame, Shield, ChevronRight, Users, Calendar } from "lucide-react";
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
  lastSurvivors: number;
  totalPlayers: number;
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
  emoji: string;
}> = {
  morning: {
    title: "НОВЫЙ ДЕНЬ НАЧАЛСЯ",
    subtitle: "Ночь забрала слабых. Сезон продолжается.",
    glow: "bg-amber-400/[0.06]",
    accent: "text-amber-300",
    emoji: "🌅",
  },
  afternoon: {
    title: "СЕЗОН В РАЗГАРЕ",
    subtitle: "Кто-то уже выдохся, кто-то только начинает.",
    glow: "bg-white/[0.02]",
    accent: "text-white/40",
    emoji: "☀️",
  },
  evening: {
    title: "ДО ВЫЛЕТА ОСТАЛОСЬ",
    subtitle: "Вечер. Норма закрыта не у всех. Каждая минута решает.",
    glow: "bg-orange-500/[0.06]",
    accent: "text-orange-300",
    emoji: "🌆",
  },
  night: {
    title: "НОЧЬ РЕШАЕТ ВСЁ",
    subtitle: "Пока город спит — сезон не спит. Кто не записал — вылетает.",
    glow: "bg-indigo-500/[0.06]",
    accent: "text-indigo-300",
    emoji: "🌙",
  },
};

// ─── World narrative posters ─────────────────────────────────────────────────

function WorldPoster({ world }: { world: WorldData | null }) {
  if (!world) return null;

  const posters: { emoji: string; text: string; sub: string; color: string }[] = [];

  // Night elimination poster
  if (world.eliminated > 0) {
    posters.push({
      emoji: "💀",
      text: `${world.eliminated} ${world.eliminated === 1 ? "игрок не пережил" : "игроков не пережили"} эту ночь`,
      sub: "Сезон забрал слабых",
      color: "border-red-900/20 bg-red-950/10",
    });
  }

  // Top 3 poster
  if (world.top3Entries.length > 0) {
    posters.push({
      emoji: "🏆",
      text: `${world.top3Entries.join(", ")} ${world.top3Entries.length === 1 ? "вошёл" : "вошли"} в TOP 3`,
      sub: "Рейтинг изменился",
      color: "border-emerald-900/20 bg-emerald-950/10",
    });
  }

  // At risk poster
  if (world.notMetTarget > 0) {
    posters.push({
      emoji: "⚠️",
      text: `${world.notMetTarget.toLocaleString("ru")} человек под угрозой вылета`,
      sub: "Не выполнили норму сегодня",
      color: "border-orange-900/20 bg-orange-950/10",
    });
  }

  // Overtake poster
  if (world.overtakes.length > 0) {
    posters.push({
      emoji: "⚡",
      text: world.overtakes[0],
      sub: "Прямо сейчас",
      color: "border-orange-900/20 bg-orange-950/10",
    });
  }

  // Last survivors poster
  if (world.lastSurvivors > 0 && world.lastSurvivors < 100) {
    posters.push({
      emoji: "⚔️",
      text: `Осталось ${world.lastSurvivors} выживших`,
      sub: `${Math.round((world.lastSurvivors / Math.max(world.totalPlayers, 1)) * 100)}% от старта сезона`,
      color: "border-amber-900/20 bg-amber-950/10",
    });
  }

  if (posters.length === 0) return null;

  return (
    <section className="mb-6 space-y-3">
      {posters.map((p, i) => (
        <div
          key={i}
          className={`rounded-[22px] border ${p.color} p-4 animate-fade-in-up`}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center shrink-0 text-[20px]">
              {p.emoji}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white/80 leading-tight">{p.text}</p>
              <p className="mt-0.5 text-[12px] text-white/30">{p.sub}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

// ─── World stats bar ─────────────────────────────────────────────────────────

function WorldStats({ world }: { world: WorldData | null }) {
  if (!world) return null;

  const daysLeft = 30 - world.seasonDay;

  return (
    <section className="mb-6 animate-fade-in-up">
      <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-[22px] font-bold tracking-tight text-white">
              {world.totalUsers > 0 ? world.totalUsers.toLocaleString("ru") : "—"}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/30">в сезоне</p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-bold tracking-tight text-white">
              {daysLeft > 0 ? daysLeft : "—"}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/30">дней осталось</p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-bold tracking-tight text-white">
              {world.totalDisciplines > 0 ? world.totalDisciplines : "—"}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/30">дисциплины</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-green-400" />
              <span className="text-[11px] text-white/40">{world.activeNow} онлайн</span>
            </div>
            {world.eventsActive > 0 && (
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-orange-400" />
                <span className="text-[11px] text-orange-300/60">{world.eventsActive} событий live</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Season progress bar ─────────────────────────────────────────────────────

function SeasonProgress({ world }: { world: WorldData | null }) {
  if (!world) return null;

  const daysLeft = 30 - world.seasonDay;
  const pct = Math.round((world.seasonDay / 30) * 100);

  return (
    <section className="mb-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Прогресс сезона</p>
        <span className="text-[11px] text-white/30">День {world.seasonDay} из 30</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-2">
        <div className="h-full rounded-full bg-white/30 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[12px] text-white/25">
        {daysLeft > 0
          ? `${daysLeft} ${daysLeft === 1 ? "день" : "дней"} до конца сезона`
          : "Сезон завершён"}
      </p>
    </section>
  );
}

// ─── Upcoming Season teaser ──────────────────────────────────────────────────

function UpcomingSeasonTeaser() {
  // Simulated countdown — in production this would come from the API
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    function calc() {
      const now = new Date();
      // Target: season 2 starts ~12 days from now (simulated)
      const target = new Date(now);
      target.setDate(target.getDate() + 12);
      target.setHours(0, 0, 0, 0);

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("УЖЕ НАЧАЛСЯ");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setCountdown(`${days}д ${hours}ч`);
    }

    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mb-6 animate-fade-in-up">
      <div className="rounded-[22px] border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-white/[0.01] p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400/70">
              СКОРО
            </p>
            <h3 className="mt-1 text-[20px] font-semibold tracking-tight text-white">
              СЕЗОН 2
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-white/30 uppercase tracking-[0.1em]">Старт через</p>
            <p className="text-[18px] font-bold text-amber-300 tabular-nums">{countdown}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[11px] text-white/50">
            🌙 Ночной режим
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[11px] text-white/50">
            🔥 IRON WEEK
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[11px] text-white/50">
            🏆 Новые дисциплины
          </span>
        </div>

        <p className="mt-3 text-[12px] text-white/25 leading-relaxed">
          Сезон 2 принесёт ночной режим, новые дисциплины и IRON WEEK — семь дней абсолютного выживания.
        </p>
      </div>
    </section>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [events, setEvents] = useState<SeasonEvent[]>([]);
  const [world, setWorld] = useState<WorldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());

  const fetchData = useCallback(async () => {
    try {
      const [feedRes, eventsRes, worldRes] = await Promise.all([
        fetch("/api/feed"),
        fetch("/api/events/live"),
        fetch("/api/world"),
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

  const timeConfig = TIME_CONFIG[timeOfDay];

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl transition-all duration-1000 ${timeConfig.glow}`} />
        <div className="absolute bottom-[-200px] right-[-80px] w-[400px] h-[400px] rounded-full blur-3xl bg-orange-500/[0.04]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-28">

        {/* TOP BAR */}
        <header className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.7)]" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/35 font-medium">
              СЕЗОН 1 АКТИВЕН
            </span>
          </div>
          <Link
            href="/login"
            className="touch-card h-10 px-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl text-sm text-white/65 inline-flex items-center justify-center active:scale-[0.98] transition-all"
          >
            Войти
          </Link>
        </header>

        {/* TIME OF DAY HERO */}
        <section className="mb-6 rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5 animate-fade-in-up animate-fade-in-up-d1">
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${timeConfig.accent}`}>
                {timeConfig.title}
              </p>
              <h1 className="mt-2 text-[32px] leading-[0.92] tracking-[-0.05em] font-semibold text-[#F5F5F5]">
                Мир
                <br />
                сезона
              </h1>
              <p className="mt-2 text-[13px] text-white/35 leading-relaxed max-w-[260px]">
                {timeConfig.subtitle}
              </p>
            </div>
            <div className="text-[32px] leading-none">{timeConfig.emoji}</div>
          </div>
        </section>

        {/* WORLD STATS — global universe stats */}
        <WorldStats world={world} />

        {/* SEASON PROGRESS */}
        <SeasonProgress world={world} />

        {/* WORLD POSTERS — narrative moments */}
        <WorldPoster world={world} />

        {/* UPCOMING SEASON TEASER */}
        <UpcomingSeasonTeaser />

        {/* LIVE EVENTS — global events anyone can see */}
        {events.length > 0 && (
          <section className="mb-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">События сейчас</p>
              <span className="text-[10px] text-orange-300/60">LIVE</span>
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

        {/* CTA — enter season */}
        <section className="mb-6 animate-fade-in-up">
          <Link
            href="/signup"
            className="touch-card w-full h-13 rounded-[20px] bg-[#F3F3F3] text-black text-[14px] font-semibold flex items-center justify-center active:scale-[0.985] transition-all shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
          >
            ВОЙТИ В СЕЗОН
          </Link>
          <p className="mt-2 text-[11px] text-white/25 text-center">
            {world?.notMetTarget
              ? `${world.notMetTarget.toLocaleString("ru")} человек ещё не выполнили норму сегодня`
              : "Ты можешь не успеть"}
          </p>
        </section>

        {/* LIVE FEED — compact preview of pulse */}
        <LiveFeed items={feed} />
      </div>
    </main>
  );
}
