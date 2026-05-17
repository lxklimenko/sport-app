import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Users, Skull, Zap, Clock, Trophy, TrendingDown, AlertTriangle, Shield, Flame } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPool, migrateDatabase } from "@/lib/db";
import { migrateEvents, getEventBySlug, getEventLeaderboard } from "@/lib/events";
import { getDisciplineLabel } from "@/lib/disciplines";

const DISCIPLINE_CONFIG: Record<string, { emoji: string; unit: string; format: (v: number) => string }> = {
  steps:   { emoji: "👟", unit: "шагов", format: (v) => v.toLocaleString("ru") },
  running: { emoji: "🏃", unit: "км",    format: (v) => v.toFixed(1) },
  burpees: { emoji: "💥", unit: "повт.", format: (v) => String(Math.floor(v)) },
};

// ─── Color themes ───────────────────────────────────────────────────────────

const THEMES: Record<string, {
  bg: string; glow: string; accent: string; accentText: string; border: string; dot: string; live: string;
}> = {
  red:    { bg: "bg-[#0a0606]", glow: "bg-red-950/20", accent: "bg-red-500/20", accentText: "text-red-400", border: "border-red-900/30", dot: "bg-red-400", live: "bg-red-500" },
  orange: { bg: "bg-[#0b0806]", glow: "bg-orange-950/20", accent: "bg-orange-500/20", accentText: "text-orange-400", border: "border-orange-900/30", dot: "bg-orange-400", live: "bg-orange-500" },
  blue:   { bg: "bg-[#06080b]", glow: "bg-blue-950/20", accent: "bg-blue-500/20", accentText: "text-blue-400", border: "border-blue-900/30", dot: "bg-blue-400", live: "bg-blue-500" },
  green:  { bg: "bg-[#060b08]", glow: "bg-emerald-950/20", accent: "bg-emerald-500/20", accentText: "text-emerald-400", border: "border-emerald-900/30", dot: "bg-emerald-400", live: "bg-emerald-500" },
  purple: { bg: "bg-[#08060b]", glow: "bg-purple-950/20", accent: "bg-purple-500/20", accentText: "text-purple-400", border: "border-purple-900/30", dot: "bg-purple-400", live: "bg-purple-500" },
};

function getTheme(color: string | null) {
  return THEMES[color ?? ""] ?? {
    bg: "bg-[#0B0B0C]", glow: "bg-white/[0.015]", accent: "bg-white/[0.05]", accentText: "text-white/60",
    border: "border-white/[0.08]", dot: "bg-white/40", live: "bg-emerald-400",
  };
}

// ─── Event story builder ────────────────────────────────────────────────────

function buildEventStory(day: number, total: number, participantCount: number, eliminatedCount: number) {
  const story: { day: number; text: string; highlight?: boolean }[] = [];
  const alive = participantCount - eliminatedCount;

  story.push({ day: 1, text: `${participantCount} внутри` });
  if (day >= 3) {
    const eliminatedByDay3 = Math.round(eliminatedCount * 0.6);
    story.push({ day: 3, text: `${eliminatedByDay3} вылетели`, highlight: eliminatedByDay3 > 0 });
  }
  if (day >= 5) {
    story.push({ day: 5, text: "TOP 10 отделились", highlight: true });
  }
  if (day >= total - 1) {
    story.push({ day: total, text: `${alive} выживших`, highlight: true });
  }

  return story.filter((s) => s.day <= day);
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
  const hour = now.getHours();

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

  // Daily target
  const dailyTarget = event.daily_target ?? 100;
  const progress = Math.min(userValue / dailyTarget, 1);
  const pct = Math.round(progress * 100);
  const isDead = userValue === 0;
  const isDanger = userValue > 0 && userValue < dailyTarget * 0.4;
  const isWarning = userValue >= dailyTarget * 0.4 && userValue < dailyTarget;
  const isSafe = userValue >= dailyTarget;

  // Pressure: dropped from TOP 10
  const droppedFromTop10 = joined && userRank && userRank > 10;
  const top10Threshold = leaderboard.length >= 10 ? leaderboard[9].value : 0;

  // Time of day
  const isMorning = hour >= 5 && hour < 12;
  const isEvening = hour >= 20 || hour < 6;
  const isLateNight = hour >= 0 && hour < 5;

  // Recent feed
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

  // Event story
  const eventDay = Math.min(Math.ceil((now.getTime() - start.getTime()) / 86400000), totalHours > 0 ? Math.ceil(totalHours / 24) : 7);
  const eventStory = buildEventStory(eventDay, Math.ceil(totalHours / 24), participantCount, eliminatedCount);

  const cfg = DISCIPLINE_CONFIG[event.discipline] ?? { emoji: "💪", unit: "раз", format: (v) => String(Math.floor(v)) };

  return (
    <main className={`min-h-screen ${theme.bg} text-white flex flex-col`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl ${theme.glow}`} />
        {isLive && (
          <div className={`absolute bottom-[-100px] right-[-80px] w-[300px] h-[300px] rounded-full blur-3xl ${theme.glow}`} />
        )}
      </div>

      <div className="relative z-10 max-w-md mx-auto w-full px-5 pt-6 pb-32">

        {/* ── TOP BAR ─────────────────────────────────────────────── */}
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

        {/* ── 1. HERO ─────────────────────────────────────────────── */}
        <section className="mb-6">
          <div className={`rounded-[22px] border ${theme.border} ${theme.accent.replace("/20", "/[0.03]")} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isLive ? theme.live : "bg-white/30"}`} />
                <span className={`text-[11px] uppercase tracking-[0.14em] ${theme.accentText}`}>
                  {isLive ? "LIVE" : isUpcoming ? "СТАРТУЕТ" : "ЗАВЕРШЕНО"}
                </span>
              </div>
              <span className="text-[11px] text-white/30">
                {cfg.emoji} {getDisciplineLabel(event.discipline)}
              </span>
            </div>

            {/* Description */}
            {event.description && (
              <p className="text-[13px] text-white/50 leading-relaxed mb-4">{event.description}</p>
            )}

            {/* Countdown */}
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
                  {isLive ? `из ${totalHours} ч` : `${totalHours} ч длительность`}
                </p>
              </div>
            </div>

            {/* Status badge */}
            {joined && (
              <div className="mt-4 flex items-center gap-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${theme.border} ${theme.accent}`}>
                  <Trophy className={`w-3.5 h-3.5 ${theme.accentText}`} />
                  <span className={`text-[12px] font-semibold ${theme.accentText}`}>
                    Ты участвуешь
                  </span>
                </div>
                {userRank && (
                  <span className="text-[12px] text-white/40">
                    #{userRank} из {participantCount}
                  </span>
                )}
              </div>
            )}

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

        {/* ── JOIN CTA ────────────────────────────────────────────── */}
        {!joined && isLive && (
          <JoinButton eventId={event.id} title={event.title} theme={theme} />
        )}

        {/* ── 2. DAILY TARGET ─────────────────────────────────────── */}
        {joined && (
          <section className="mb-5">
            <div className={`rounded-[22px] border ${isDead ? "border-red-900/30 bg-red-950/15" : isDanger ? "border-red-900/20 bg-red-950/10" : isWarning ? "border-orange-900/20 bg-orange-950/10" : "border-emerald-900/20 bg-emerald-950/10"} p-5`}>
              {/* Big number */}
              <div className="text-center mb-4">
                <p className={`text-[64px] font-semibold tracking-[-0.06em] leading-none ${isDead ? "text-white/15" : isDanger ? "text-red-400/70" : isSafe ? "text-emerald-400" : "text-white/80"}`}>
                  {cfg.format(userValue)}
                </p>
                <p className={`text-[12px] uppercase tracking-[0.2em] mt-1 ${isDead ? "text-white/15" : "text-white/40"}`}>
                  из {cfg.format(dailyTarget)} {cfg.unit}
                </p>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isSafe ? "bg-emerald-400" : isDanger ? "bg-red-400" : "bg-white/40"}`}
                  style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                />
              </div>

              {/* Pressure text */}
              <div className="flex items-start gap-2">
                {isDead ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : isSafe ? (
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Flame className={`w-4 h-4 ${isDanger ? "text-red-400" : "text-orange-400"} shrink-0 mt-0.5`} />
                )}
                <p className={`text-[13px] leading-relaxed ${isDead ? "text-red-400" : isSafe ? "text-emerald-400/70" : isDanger ? "text-red-300" : "text-orange-300"}`}>
                  {isDead
                    ? "Ты ещё ничего не записал. Каждый час — места в рейтинге."
                    : isSafe
                    ? `Цель выполнена. Можно добавить ещё ${cfg.format(dailyTarget)} для укрепления.`
                    : `До безопасности осталось ${cfg.format(dailyTarget - userValue)} ${cfg.unit}`}
                </p>
              </div>

              {/* Time of day pressure */}
              {isEvening && !isSafe && !isDead && (
                <div className="mt-3 rounded-xl border border-orange-900/30 bg-orange-950/15 p-3">
                  <p className="text-[12px] text-orange-300 font-semibold">
                    {isLateNight
                      ? "Ночь. 37 игроков уже не успеют."
                      : "До вылета осталось 2 часа."}
                  </p>
                </div>
              )}

              {isMorning && isSafe && (
                <div className="mt-3 rounded-xl border border-emerald-900/30 bg-emerald-950/15 p-3">
                  <p className="text-[12px] text-emerald-300 font-semibold">
                    Ты пережил ночь. День продолжается.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 3. PRESSURE: dropped from TOP 10 ────────────────────── */}
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

        {/* ── 4. EVENT LEADERBOARD ────────────────────────────────── */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Таблица лидеров</p>
            <p className="text-[11px] text-white/20">{participantCount} участников</p>
          </div>

          <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] overflow-hidden">
            {/* TOP 3 — huge */}
            {leaderboard.slice(0, 3).map((entry, i) => {
              const isMe = entry.user_id === session.userId;
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <Link
                  key={entry.user_id}
                  href={`/user/${entry.user_id}`}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${isMe ? "bg-white/[0.05]" : ""}`}
                >
                  <span className="text-[18px] w-8 shrink-0">{medals[i]}</span>
                  <span className={`flex-1 text-[14px] truncate ${isMe ? "text-white font-semibold" : "text-white/60"}`}>
                    {entry.name.split(/\s+/)[0]}
                  </span>
                  <span className={`text-[14px] tabular-nums font-semibold ${isMe ? "text-white" : "text-white/50"}`}>
                    {cfg.format(entry.value)}
                  </span>
                </Link>
              );
            })}

            {/* Rest of leaderboard */}
            {leaderboard.slice(3, 10).map((entry) => {
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

        {/* ── 5. LIVE FEED ────────────────────────────────────────── */}
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

        {/* ── 6. ELIMINATION PRESSURE ─────────────────────────────── */}
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

        {/* ── 7. PARTICIPANTS SOCIAL PROOF ────────────────────────── */}
        {participantCount > 0 && (
          <section className="mb-5">
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-3">Участники</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[20px] font-semibold text-white/80">{participantCount}</p>
                  <p className="text-[9px] text-white/25 uppercase tracking-[0.1em] mt-0.5">Всего</p>
                </div>
                <div>
                  <p className="text-[20px] font-semibold text-emerald-400/80">{aliveCount}</p>
                  <p className="text-[9px] text-white/25 uppercase tracking-[0.1em] mt-0.5">Выжили</p>
                </div>
                <div>
                  <p className="text-[20px] font-semibold text-red-400/60">{eliminatedCount}</p>
                  <p className="text-[9px] text-white/25 uppercase tracking-[0.1em] mt-0.5">Выбыли</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 8. EVENT STORY ──────────────────────────────────────── */}
        {eventStory.length > 0 && (
          <section className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-2">История события</p>
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.018] overflow-hidden">
              {eventStory.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 ${s.highlight ? "bg-white/[0.03]" : ""}`}
                >
                  <div className={`w-6 h-6 rounded-lg ${s.highlight ? "bg-white/[0.08]" : "bg-white/[0.03]"} flex items-center justify-center shrink-0`}>
                    <span className="text-[10px] text-white/40 font-semibold">D{s.day}</span>
                  </div>
                  <p className={`text-[13px] ${s.highlight ? "text-white/70 font-semibold" : "text-white/45"}`}>
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* ── 3. CTA — always visible sticky bottom ────────────────── */}
      {joined && isLive && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/95 to-transparent z-20">
          <Link
            href={`/record?d=${event.discipline}`}
            className={`w-full max-w-md mx-auto h-14 rounded-[20px] ${theme.accent} ${theme.accentText} text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all border ${theme.border} shadow-[0_10px_40px_rgba(0,0,0,0.3)]`}
          >
            <Zap className="w-4 h-4" />
            ЗАПИСАТЬ РЕЗУЛЬТАТ
            <span className={`${theme.accentText}/50`}>· {cfg.emoji}</span>
          </Link>
        </div>
      )}
    </main>
  );
}

import { JoinButton } from "./join-button";
