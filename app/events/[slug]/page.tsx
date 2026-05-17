import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Users, Skull, Zap, Clock, Trophy, TrendingDown, AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPool, migrateDatabase } from "@/lib/db";
import { migrateEvents, getEventBySlug, getEventLeaderboard } from "@/lib/events";
import { getDisciplineLabel } from "@/lib/disciplines";

const DISCIPLINE_CONFIG: Record<string, { emoji: string; unit: string; format: (v: number) => string }> = {
  steps:   { emoji: "👟", unit: "шагов", format: (v) => v.toLocaleString("ru") },
  running: { emoji: "🏃", unit: "км",    format: (v) => v.toFixed(1) },
  burpees: { emoji: "💥", unit: "повт.", format: (v) => String(Math.floor(v)) },
};

// ─── Color themes per badge_color ────────────────────────────────────────────

const THEMES: Record<string, {
  bg: string;
  glow: string;
  accent: string;
  accentText: string;
  border: string;
  dot: string;
  live: string;
}> = {
  red:    { bg: "bg-[#0a0606]", glow: "bg-red-950/20", accent: "bg-red-500/20", accentText: "text-red-400", border: "border-red-900/30", dot: "bg-red-400", live: "bg-red-500" },
  orange: { bg: "bg-[#0b0806]", glow: "bg-orange-950/20", accent: "bg-orange-500/20", accentText: "text-orange-400", border: "border-orange-900/30", dot: "bg-orange-400", live: "bg-orange-500" },
  blue:   { bg: "bg-[#06080b]", glow: "bg-blue-950/20", accent: "bg-blue-500/20", accentText: "text-blue-400", border: "border-blue-900/30", dot: "bg-blue-400", live: "bg-blue-500" },
  green:  { bg: "bg-[#060b08]", glow: "bg-emerald-950/20", accent: "bg-emerald-500/20", accentText: "text-emerald-400", border: "border-emerald-900/30", dot: "bg-emerald-400", live: "bg-emerald-500" },
  purple: { bg: "bg-[#08060b]", glow: "bg-purple-950/20", accent: "bg-purple-500/20", accentText: "text-purple-400", border: "border-purple-900/30", dot: "bg-purple-400", live: "bg-purple-500" },
};

function getTheme(color: string | null) {
  return THEMES[color ?? ""] ?? {
    bg: "bg-[#0B0B0C]",
    glow: "bg-white/[0.015]",
    accent: "bg-white/[0.05]",
    accentText: "text-white/60",
    border: "border-white/[0.08]",
    dot: "bg-white/40",
    live: "bg-emerald-400",
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  await migrateDatabase();
  await migrateEvents();
  const db = getPool();

  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) redirect("/season/current");

  const now = new Date();
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);
  const isLive = start <= now && end > now;
  const isUpcoming = start > now;
  const endsIn = Math.round((end.getTime() - now.getTime()) / 3600000);
  const startsIn = Math.round((start.getTime() - now.getTime()) / 3600000);
  const totalHours = Math.round((end.getTime() - start.getTime()) / 3600000);

  const theme = getTheme(event.badge_color);

  // Check if user joined
  const { rows: joinRows } = await db.query(
    "SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2",
    [event.id, session.userId]
  );
  const joined = joinRows.length > 0;

  // Participant counts
  const { rows: countRows } = await db.query(
    `SELECT
       COUNT(*)::int AS total,
       COALESCE(SUM(CASE WHEN is_alive = true THEN 1 ELSE 0 END), 0)::int AS alive,
       COALESCE(SUM(CASE WHEN is_alive = false THEN 1 ELSE 0 END), 0)::int AS eliminated
     FROM event_participants WHERE event_id = $1`,
    [event.id]
  );
  const participantCount = countRows[0]?.total ?? 0;
  const aliveCount = countRows[0]?.alive ?? 0;
  const eliminatedCount = countRows[0]?.eliminated ?? 0;

  // Leaderboard
  const leaderboard = await getEventLeaderboard(event.id, event.discipline, 20);

  // User's rank
  const userEntry = leaderboard.find((e) => e.user_id === session.userId);
  const userRank = userEntry?.rank ?? null;
  const userValue = userEntry?.value ?? 0;

  // Pressure: dropped out of TOP 10?
  const droppedFromTop10 = joined && userRank && userRank > 10;
  const top10Threshold = leaderboard.length >= 10 ? leaderboard[9].value : 0;

  // Recent feed for this discipline
  const { rows: feedRows } = await db.query<{
    name: string; value: string; minutes_ago: string;
  }>(
    `SELECT u.name,
            a.value::float AS value,
            ROUND(EXTRACT(EPOCH FROM (NOW() - a.recorded_at)) / 60) AS minutes_ago
     FROM activities a
     JOIN users u ON u.id = a.user_id
     WHERE a.discipline_id = $1 AND a.recorded_at >= $2
     ORDER BY a.recorded_at DESC
     LIMIT 5`,
    [event.discipline, event.starts_at]
  );

  const cfg = DISCIPLINE_CONFIG[event.discipline] ?? { emoji: "💪", unit: "раз", format: (v) => String(Math.floor(v)) };

  return (
    <main className={`min-h-screen ${theme.bg} text-white flex flex-col`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl ${theme.glow}`} />
        {isLive && (
          <div className={`absolute bottom-[-100px] right-[-80px] w-[300px] h-[300px] rounded-full blur-3xl ${theme.glow}`} />
        )}
      </div>

      <div className="relative z-10 max-w-md mx-auto w-full px-5 pt-6 pb-28">
        {/* TOP BAR */}
        <header className="flex items-center gap-3 mb-6">
          <Link
            href="/season/current"
            className="w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[20px]">{event.emoji ?? "📅"}</span>
            <div>
              <p className={`text-[11px] uppercase tracking-[0.2em] ${theme.accentText} leading-none`}>
                {isLive ? "Событие идёт" : isUpcoming ? "Скоро" : "Завершено"}
              </p>
              <p className="text-[16px] font-semibold leading-tight">{event.title}</p>
            </div>
          </div>
        </header>

        {/* HERO COUNTDOWN */}
        <section className="mb-6">
          <div className={`rounded-[22px] border ${theme.border} ${theme.accent.replace("bg-", "bg-").replace("/20", "/[0.03]")} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isLive ? theme.live : "bg-white/30"}`} />
                <span className={`text-[11px] uppercase tracking-[0.14em] ${theme.accentText}`}>
                  {isLive ? "LIVE" : isUpcoming ? "СТАРТУЕТ" : "ЗАВЕРШЕНО"}
                </span>
              </div>
              <span className="text-[11px] text-white/30">
                {event.discipline === "burpees" ? "💥" : cfg.emoji} {getDisciplineLabel(event.discipline)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Clock className={`w-5 h-5 ${theme.accentText}`} />
              <div>
                <p className="text-[28px] font-semibold tracking-tight">
                  {isLive
                    ? `Осталось ${endsIn} ч`
                    : isUpcoming
                    ? `Старт через ${startsIn} ч`
                    : "Завершено"}
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  {isLive
                    ? `из ${totalHours} ч`
                    : `${totalHours} ч длительность`}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 flex items-center gap-4 text-[12px] text-white/40">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{participantCount} {participantCount === 1 ? "участник" : "участников"}</span>
              </div>
              {aliveCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Zap className={`w-3.5 h-3.5 ${theme.accentText}/60`} />
                  <span className={`${theme.accentText}/60`}>{aliveCount} в игре</span>
                </div>
              )}
              {eliminatedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Skull className="w-3.5 h-3.5 text-red-400/40" />
                  <span className="text-red-400/40">{eliminatedCount} выбыли</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* JOIN CTA */}
        {!joined && isLive && (
          <JoinButton eventId={event.id} title={event.title} theme={theme} />
        )}

        {/* YOUR STATUS */}
        {joined && (
          <section className="mb-5">
            <div className={`rounded-[22px] border ${theme.border} ${theme.accent.replace("/20", "/[0.04]")} p-4`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl border ${theme.border} ${theme.accent} flex items-center justify-center shrink-0`}>
                  <Trophy className={`w-4 h-4 ${theme.accentText}`} />
                </div>
                <div>
                  <p className={`text-[14px] font-semibold ${theme.accentText}`}>
                    Ты участвуешь
                  </p>
                  <p className="text-[12px] text-white/35 mt-0.5">
                    {userRank ? `#${userRank} · ${cfg.format(userValue)} ${cfg.unit}` : "Пока без результата"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PRESSURE: dropped from TOP 10 */}
        {droppedFromTop10 && (
          <section className="mb-5">
            <div className="rounded-[22px] border border-red-900/30 bg-red-950/15 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl border border-red-900/30 bg-red-950/20 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-red-300 leading-tight">
                    Ты выпал из TOP 10
                  </p>
                  <p className="mt-1 text-[12px] text-white/35 leading-relaxed">
                    #{userRank} место · До TOP 10 нужно {cfg.format(top10Threshold - userValue)} {cfg.unit}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ELIMINATION MOMENT */}
        {eliminatedCount > 0 && (
          <section className="mb-5">
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
                  <Skull className="w-4 h-4 text-white/40" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white/70">
                    {eliminatedCount} {eliminatedCount === 1 ? "игрок выбыл" : "игроков выбыли"}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {aliveCount} осталось в игре · {Math.round((aliveCount / participantCount) * 100)}% выживаемость
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* LEADERBOARD */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Таблица лидеров</p>
            <p className="text-[11px] text-white/20">{participantCount} участников</p>
          </div>

          <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] overflow-hidden">
            {leaderboard.slice(0, 10).map((entry) => {
              const isMe = entry.user_id === session.userId;
              return (
                <Link
                  key={entry.user_id}
                  href={`/user/${entry.user_id}`}
                  className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.03] ${isMe ? "bg-white/[0.05]" : ""}`}
                >
                  <span className={`text-[11px] w-8 shrink-0 ${isMe ? "text-white/50 font-medium" : "text-white/25"}`}>
                    #{entry.rank}
                  </span>
                  <span className={`flex-1 text-[13px] truncate ${isMe ? "text-white font-semibold" : "text-white/45"}`}>
                    {entry.name.split(/\s+/)[0]}
                  </span>
                  <span className={`text-[13px] tabular-nums ${isMe ? "text-white font-semibold" : "text-white/40"}`}>
                    {cfg.format(entry.value)}
                  </span>
                </Link>
              );
            })}
            {leaderboard.length === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-[12px] text-white/25">Пока никто не присоединился</p>
              </div>
            )}
          </div>
        </section>

        {/* RECENT FEED */}
        {feedRows.length > 0 && (
          <section className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-2">Активность</p>
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.018] overflow-hidden">
              {feedRows.map((row, i) => {
                const mins = parseInt(row.minutes_ago, 10);
                const timeAgo = mins < 1 ? "только что" : `${mins} мин назад`;
                const shortName = row.name.trim().split(/\s+/)[0];
                return (
                  <Link
                    key={i}
                    href={`/user/${row.name}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${theme.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/75 leading-tight">
                        {shortName} записал {cfg.format(parseFloat(row.value))} {cfg.unit}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/30">{timeAgo}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* RECORD CTA */}
        {joined && isLive && (
          <Link
            href={`/record?d=${event.discipline}`}
            className={`w-full h-14 rounded-[20px] ${theme.accent} ${theme.accentText} text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all border ${theme.border}`}
          >
            <Zap className="w-4 h-4" />
            ЗАПИСАТЬ РЕЗУЛЬТАТ
            <span className={`${theme.accentText}/50`}>· {cfg.emoji}</span>
          </Link>
        )}
      </div>
    </main>
  );
}

// ─── Client component for join button ────────────────────────────────────────

import { JoinButton } from "./join-button";
