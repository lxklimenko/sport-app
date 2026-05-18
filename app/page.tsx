"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LiveFeed } from "./live-feed";
import { EventCard } from "@/components/event-card";
import { DisciplineModal } from "@/components/discipline-modal";
import { AnimatedCounter } from "@/components/animated-counter";
import { Skull, Trophy, Zap, Clock, Activity, Flame, Shield, ChevronRight } from "lucide-react";
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

// ─── page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [events, setEvents] = useState<SeasonEvent[]>([]);
  const [world, setWorld] = useState<WorldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
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
            className="h-10 px-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl text-sm text-white/65 inline-flex items-center justify-center active:scale-[0.98] transition-all"
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

        {/* WORLD STATS */}
        <WorldStats world={world} />

        {/* SEASON PROGRESS */}
        <SeasonProgress world={world} />

        {/* WORLD POSTERS — narrative moments */}
        <WorldPoster world={world} />

        {/* LIVE EVENTS */}
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

        {/* DISCIPLINES */}
        <section className="mb-6 animate-fade-in-up">
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

        {/* CTA — enter season */}
        <section className="mb-6 animate-fade-in-up">
          <Link
            href="/signup"
            className="w-full h-13 rounded-[20px] bg-[#F3F3F3] text-black text-[14px] font-semibold flex items-center justify-center active:scale-[0.985] transition-all shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
          >
            ВОЙТИ В СЕЗОН
          </Link>
          <p className="mt-2 text-[11px] text-white/25 text-center">
            {world?.notMetTarget
              ? `${world.notMetTarget.toLocaleString("ru")} человек ещё не выполнили норму сегодня`
              : "Ты можешь не успеть"}
          </p>
        </section>

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
