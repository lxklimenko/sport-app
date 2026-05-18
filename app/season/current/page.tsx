import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Shield, ChevronUp, ChevronDown, ChevronRight, Minus, Zap, LogOut, Clock, Flame, Activity } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPool, migrateDatabase } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { generateDangerNotification } from "@/lib/notifications";
import { getDisciplineLabel } from "@/lib/disciplines";
import { NotificationBell } from "@/components/notification-bell";
import { EventCard } from "@/components/event-card";
import { migrateSurvival, getSurvival } from "@/lib/survival";
import { migrateEvents, getEventsWithParticipation, joinEvent, type SeasonEvent } from "@/lib/events";
import { getCurrentSeason } from "@/lib/season";
import { Pool } from "pg";

const DISCIPLINE_CONFIG = {
  steps:   { emoji: "👟", name: "Шаги",  unit: "шагов", heroUnit: "ШАГОВ",  target: 10000, format: (v: number) => v.toLocaleString("ru") },
  running: { emoji: "🏃", name: "Бег",   unit: "км",    heroUnit: "КМ",     target: 5,     format: (v: number) => v.toFixed(1) },
  burpees: { emoji: "💥", name: "Бёрпи", unit: "повт.", heroUnit: "ПОВТ.",  target: 50,    format: (v: number) => String(Math.floor(v)) },
} as const;

type DisciplineId = keyof typeof DISCIPLINE_CONFIG;
type DangerLevel = "dead" | "danger" | "warning" | "safe";

function getDangerLevel(value: number, target: number): DangerLevel {
  if (value === 0) return "dead";
  if (value < target * 0.4) return "danger";
  if (value < target) return "warning";
  return "safe";
}

// ─── db helpers ──────────────────────────────────────────────────────────────

async function getRealRivals(db: Pool, disciplineId: string, userId: string) {
  const { rows } = await db.query<{
    user_id: string; name: string; today_total: string; rank: string;
  }>(
    `WITH ranked AS (
       SELECT
         ud.user_id,
         u.name,
         COALESCE(SUM(a.value), 0) AS today_total,
         ROW_NUMBER() OVER (
           ORDER BY COALESCE(SUM(a.value), 0) DESC, ud.user_id
         ) AS rank
       FROM user_disciplines ud
       JOIN users u ON u.id = ud.user_id
       LEFT JOIN activities a
         ON a.user_id = ud.user_id
         AND a.discipline_id = ud.discipline_id
         AND a.recorded_at::date = CURRENT_DATE
       WHERE ud.discipline_id = $1
       GROUP BY ud.user_id, u.name
     ),
     me AS (SELECT rank FROM ranked WHERE user_id = $2)
     SELECT r.user_id, r.name, r.today_total::float, r.rank::int
     FROM ranked r, me
     WHERE r.rank BETWEEN me.rank - 2 AND me.rank + 2
     ORDER BY r.rank`,
    [disciplineId, userId]
  );

  const enriched = await Promise.all(
    rows.map(async (r) => {
      if (r.user_id === userId) return { ...r, days_ahead: 0 };

      const { rows: streakRows } = await db.query<{ days: string }>(
        `SELECT COUNT(*) AS days FROM (
           SELECT DISTINCT a.recorded_at::date AS d
           FROM activities a
           WHERE a.user_id = $1 AND a.discipline_id = $2
         ) user_days
         WHERE EXISTS (
           SELECT 1 FROM activities a2
           WHERE a2.user_id = $3 AND a2.discipline_id = $2 AND a2.recorded_at::date = user_days.d
           GROUP BY a2.recorded_at::date
           HAVING COALESCE(SUM(a2.value), 0) > (
             SELECT COALESCE(SUM(a3.value), 0)
             FROM activities a3
             WHERE a3.user_id = $1 AND a3.discipline_id = $2 AND a3.recorded_at::date = user_days.d
           )
         )`,
        [userId, disciplineId, r.user_id]
      );

      return { ...r, days_ahead: parseInt(streakRows[0]?.days ?? "0", 10) };
    })
  );

  return enriched;
}

type FeedItem = { text: string; sub: string; dot: "red" | "orange" | "green" | "white" };

async function getLiveFeed(db: Pool, disciplineId: string, season: { number: number; day: number; total: number }): Promise<FeedItem[]> {
  const { rows: recentRows } = await db.query<{
    name: string; discipline_id: string; value: string; minutes_ago: string;
  }>(
    `SELECT u.name,
            a.discipline_id,
            a.value::float AS value,
            ROUND(EXTRACT(EPOCH FROM (NOW() - a.recorded_at)) / 60) AS minutes_ago
     FROM activities a
     JOIN users u ON u.id = a.user_id
     WHERE a.recorded_at > NOW() - INTERVAL '2 hours'
     ORDER BY a.recorded_at DESC
     LIMIT 3`,
    []
  );

  const { rows: riskRows } = await db.query<{ at_risk: string }>(
    `SELECT COUNT(*) AS at_risk
     FROM user_disciplines ud
     WHERE ud.discipline_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM activities a
         WHERE a.user_id = ud.user_id
           AND a.discipline_id = $1
           AND a.recorded_at::date = CURRENT_DATE
       )`,
    [disciplineId]
  );
  const atRisk = parseInt(riskRows[0].at_risk, 10);

  const feed: FeedItem[] = [];

  for (const row of recentRows) {
    const cfg = DISCIPLINE_CONFIG[row.discipline_id as DisciplineId];
    if (!cfg) continue;
    const mins = parseInt(row.minutes_ago, 10);
    const timeAgo = mins < 1 ? "только что" : `${mins} мин назад`;
    const shortName = row.name.trim().split(/\s+/)[0];
    feed.push({
      text: `${shortName} записал ${cfg.format(parseFloat(row.value))} ${cfg.unit}`,
      sub: timeAgo,
      dot: "green",
    });
  }

  if (atRisk > 0) {
    feed.push({
      text: `${atRisk.toLocaleString("ru")} ${atRisk === 1 ? "участник" : "участников"} ещё ничего не записали`,
      sub: "сегодня",
      dot: "red",
    });
  }

  feed.push({
    text: `Сезон ${season.number} · День ${season.day} из ${season.total}`,
    sub: `${season.total - season.day} дней до конца`,
    dot: "orange",
  });

  return feed.slice(0, 4);
}

// ─── sub-components ─────────────────────────────────────────────────────────

function DisciplineTab({ id, cfg, active }: {
  id: string;
  cfg: (typeof DISCIPLINE_CONFIG)[DisciplineId];
  active: boolean;
}) {
  return (
    <Link
      href={`/season/current?d=${id}`}
      className={[
        "touch-card flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all",
        active ? "bg-white/[0.1] text-white border border-white/[0.12]" : "text-white/35 hover:text-white/60",
      ].join(" ")}
    >
      {cfg.emoji} {cfg.name}
    </Link>
  );
}

function LiveFeed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) return null;
  const dotColor = { red: "bg-[#FFB4AB]", orange: "bg-orange-400", green: "bg-green-400", white: "bg-white/40" };
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Сейчас в сезоне</p>
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      </div>
      <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.018] overflow-hidden">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor[item.dot]} mt-[5px] shrink-0`} />
            <div>
              <p className="text-[13px] text-white/75 leading-tight">{item.text}</p>
              <p className="mt-0.5 text-[11px] text-white/30">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function SeasonCurrentPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  await migrateDatabase();
  const db = getPool();
  const SEASON = await getCurrentSeason();

  const disciplinesRes = await db.query<{ discipline_id: string }>(
    "SELECT discipline_id FROM user_disciplines WHERE user_id = $1 ORDER BY joined_at",
    [session.userId]
  );
  const joinedIds = disciplinesRes.rows.map((r) => r.discipline_id);
  if (joinedIds.length === 0) redirect("/onboarding");

  const params = await searchParams;
  const activeDisciplineId = (
    params.d && joinedIds.includes(params.d) ? params.d : joinedIds[0]
  ) as DisciplineId;
  const cfg = DISCIPLINE_CONFIG[activeDisciplineId] ?? DISCIPLINE_CONFIG.steps;

  // ── Session-level data (survival stats, rivals, hours away) ──────────
  const [survivalRes, rivalsBeatenRes, lastSeenRes] = await Promise.all([
    db.query(
      `SELECT
         COALESCE(SUM(survived_days), 0)::int AS total_survived,
         COALESCE(MAX(current_streak), 0)::int AS current_streak,
         COALESCE(SUM(CASE WHEN is_alive = true THEN 1 ELSE 0 END), 0)::int AS alive_disciplines
       FROM user_survival
       WHERE user_id = $1`,
      [session.userId]
    ),
    db.query<{ beaten: string }>(
      `SELECT COUNT(*)::int AS beaten
       FROM (
         SELECT ud.user_id,
           COALESCE(SUM(a.value), 0) AS my_total
         FROM user_disciplines ud
         LEFT JOIN activities a ON a.user_id = ud.user_id AND a.discipline_id = ud.discipline_id AND a.recorded_at::date = CURRENT_DATE
         WHERE ud.discipline_id IN (SELECT discipline_id FROM user_disciplines WHERE user_id = $1)
         GROUP BY ud.user_id
       ) me
       JOIN (
         SELECT ud.user_id,
           COALESCE(SUM(a.value), 0) AS their_total
         FROM user_disciplines ud
         LEFT JOIN activities a ON a.user_id = ud.user_id AND a.discipline_id = ud.discipline_id AND a.recorded_at::date = CURRENT_DATE
         WHERE ud.discipline_id IN (SELECT discipline_id FROM user_disciplines WHERE user_id = $1)
         GROUP BY ud.user_id
       ) them ON them.user_id != $1
       WHERE me.user_id = $1 AND them.their_total < me.my_total`,
      [session.userId]
    ),
    db.query<{ last_seen: string }>(
      `SELECT MAX(recorded_at)::text AS last_seen
       FROM activities
       WHERE user_id = $1`,
      [session.userId]
    ),
  ]);

  const survival = survivalRes.rows[0] ?? { total_survived: 0, current_streak: 0, alive_disciplines: 0 };
  const rivalsBeaten = parseInt(rivalsBeatenRes.rows[0]?.beaten ?? "0", 10);
  const lastSeenAt = lastSeenRes.rows[0]?.last_seen ?? null;

  // Hours away
  let hoursAway: number | null = null;
  if (lastSeenAt) {
    const lastSeen = new Date(lastSeenAt);
    hoursAway = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60));
  }

  // ── Discipline-level data ────────────────────────────────────────────
  const [todayRes, daysRes, rivalsRows, feedItems] = await Promise.all([
    db.query<{ total: string }>(
      `SELECT COALESCE(SUM(value), 0) AS total
       FROM activities
       WHERE user_id = $1 AND discipline_id = $2 AND recorded_at::date = CURRENT_DATE`,
      [session.userId, activeDisciplineId]
    ),
    db.query<{ days: string }>(
      `SELECT COUNT(DISTINCT recorded_at::date) AS days
       FROM activities WHERE user_id = $1`,
      [session.userId]
    ),
    getRealRivals(db, activeDisciplineId, session.userId),
    getLiveFeed(db, activeDisciplineId, SEASON),
  ]);

  const todayValue = parseFloat(todayRes.rows[0].total);
  const activeDays = parseInt(daysRes.rows[0].days, 10);
  const danger = getDangerLevel(todayValue, cfg.target);
  const progress = Math.min(todayValue / cfg.target, 1);
  const pct = Math.round(progress * 100);
  const daysLeft = SEASON.total - SEASON.day;

  const userRivalRow = rivalsRows.find((r) => r.user_id === session.userId);
  const userRank = userRivalRow ? parseInt(userRivalRow.rank as unknown as string, 10) : null;
  const above = rivalsRows.filter((r) => userRank && parseInt(r.rank as unknown as string, 10) < userRank);
  const below = rivalsRows.filter((r) => userRank && parseInt(r.rank as unknown as string, 10) > userRank);

  // Rival just ahead
  const rivalJustAhead = above.length > 0 ? above[above.length - 1] : null;
  let stepsToRival: number | null = null;
  if (rivalJustAhead) {
    const rivalRes2 = await db.query<{ total: string }>(
      `SELECT COALESCE(SUM(value), 0) AS total
       FROM activities
       WHERE user_id = $1 AND discipline_id = $2 AND recorded_at::date = CURRENT_DATE`,
      [session.userId, activeDisciplineId]
    );
    const myActualTotal = parseFloat(rivalRes2.rows[0]?.total ?? "0");
    const rivalActualTotal = parseFloat(rivalJustAhead.today_total as unknown as string);
    stepsToRival = Math.max(0, rivalActualTotal - myActualTotal);
  }

  const totalRes = await db.query<{ count: string }>(
    "SELECT COUNT(*) FROM user_disciplines WHERE discipline_id = $1",
    [activeDisciplineId]
  );
  const totalPlayers = parseInt(totalRes.rows[0].count, 10);

  // ── Last survivors count ───────────────────────────────────────
  const { rows: aliveRows } = await db.query<{ count: string }>(
    `SELECT COUNT(*) FROM user_survival
     WHERE discipline_id = $1 AND is_alive = TRUE`,
    [activeDisciplineId]
  );
  const aliveCount = parseInt(aliveRows[0]?.count ?? "0", 10);
  const survivalPct = totalPlayers > 0 ? Math.min(Math.round((aliveCount / totalPlayers) * 100), 100) : 100;
  const isLastPhase = survivalPct < 30 && aliveCount > 0;

  // ── Dead vs Alive tension ───────────────────────────────────────
  const { rows: deadVsAliveRows } = await db.query<{ alive_avg: string; dead_avg: string }>(
    `SELECT
       COALESCE((SELECT AVG(daily.total) FROM (SELECT COALESCE(SUM(a.value), 0) AS total FROM activities a JOIN user_disciplines ud ON ud.user_id = a.user_id AND ud.discipline_id = $1 WHERE a.discipline_id = $1 AND a.recorded_at::date = CURRENT_DATE AND EXISTS (SELECT 1 FROM user_survival us WHERE us.user_id = a.user_id AND us.discipline_id = $1 AND us.is_alive = TRUE) GROUP BY a.user_id) daily), 0) AS alive_avg,
       COALESCE((SELECT AVG(daily.total) FROM (SELECT COALESCE(SUM(a.value), 0) AS total FROM activities a JOIN user_disciplines ud ON ud.user_id = a.user_id AND ud.discipline_id = $1 WHERE a.discipline_id = $1 AND a.recorded_at::date = CURRENT_DATE AND NOT EXISTS (SELECT 1 FROM user_survival us WHERE us.user_id = a.user_id AND us.discipline_id = $1 AND us.is_alive = TRUE) GROUP BY a.user_id) daily), 0) AS dead_avg`,
    [activeDisciplineId]
  );
  const aliveAvg = parseFloat(deadVsAliveRows[0]?.alive_avg ?? "0");
  const deadAvg = parseFloat(deadVsAliveRows[0]?.dead_avg ?? "0");
  const deadWinning = deadAvg > aliveAvg && aliveAvg > 0;

  const pressureMsg =
    danger === "dead"
      ? { headline: `${((userRank ?? 2) - 1).toLocaleString("ru")} человек уже впереди тебя`, sub: "Ты ещё ничего не записал сегодня. Каждый час — это места в рейтинге." }
      : danger === "danger"
      ? { headline: "Ты падаешь в рейтинге прямо сейчас", sub: `Осталось ${cfg.format(cfg.target - todayValue)} ${cfg.unit} до нормы — запиши сейчас.` }
      : danger === "warning"
      ? { headline: `Осталось ${cfg.format(cfg.target - todayValue)} ${cfg.unit}`, sub: "Почти у цели — не останавливайся." }
      : { headline: "Ты выполнил норму на сегодня", sub: "Ты в безопасности. Можно добавить ещё." };

  await migrateSurvival();
  let events: (SeasonEvent & { joined: boolean })[] = [];
  try {
    await migrateEvents();
    events = await getEventsWithParticipation(session.userId);
  } catch (e) {
    console.error("migrateEvents error:", e);
  }
  const disciplineSurvival = await getSurvival(session.userId, activeDisciplineId);

  const disciplineLabel = getDisciplineLabel(activeDisciplineId);
  generateDangerNotification(
    session.userId,
    activeDisciplineId,
    disciplineLabel,
    cfg.target
  ).catch(() => {});

  const isDead = danger === "dead";
  const isRed = danger === "dead" || danger === "danger";

  // ── Evening pressure (after 20:00) ──────────────────────────────
  const now = new Date();
  const hour = now.getHours();
  const isEvening = hour >= 20 || hour < 6;
  const eveningUrgency = isEvening && !isDead && danger !== "safe"
    ? `До вылета осталось ${cfg.format(cfg.target - todayValue)} ${cfg.unit}`
    : null;

  // ── Morning survival moment ─────────────────────────────────────
  const isMorning = hour >= 5 && hour < 12;
  const justStartedToday = todayValue === 0;

  // ── Final week mode ─────────────────────────────────────────────
  const isFinalWeek = daysLeft <= 7 && daysLeft > 0;
  const isFinalDays = daysLeft <= 3 && daysLeft > 0;
  const finalWeekBg = isFinalDays ? "bg-[#080808]" : isFinalWeek ? "bg-[#09090a]" : null;

  // ── Night reset moment ──────────────────────────────────────────
  const isNightReset = hour >= 0 && hour < 5;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const { rows: yesterdayRows } = await db.query<{ total: string }>(
    `SELECT COALESCE(SUM(value), 0) AS total
     FROM activities
     WHERE user_id = $1 AND discipline_id = $2 AND recorded_at::date = $3`,
    [session.userId, activeDisciplineId, yesterdayStr]
  );
  const yesterdayTotal = parseFloat(yesterdayRows[0]?.total ?? "0");
  const survivedYesterday = yesterdayTotal >= cfg.target;

  // ── SPECTATOR MODE (eliminated but still in the world) ──────────
  if (disciplineSurvival && !disciplineSurvival.is_alive) {
    const { rows: fallenRows } = await db.query<{ rank: string; total: string }>(
      `WITH fallen AS (
         SELECT ud.user_id, u.name,
           COALESCE(SUM(a.value), 0) AS total,
           ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.value), 0) DESC) AS rank
         FROM user_disciplines ud
         JOIN users u ON u.id = ud.user_id
         LEFT JOIN activities a ON a.user_id = ud.user_id AND a.discipline_id = ud.discipline_id AND a.recorded_at::date = CURRENT_DATE
         WHERE ud.discipline_id = $1
           AND NOT EXISTS (SELECT 1 FROM user_survival us WHERE us.user_id = ud.user_id AND us.discipline_id = $1 AND us.is_alive = TRUE)
         GROUP BY ud.user_id, u.name
       )
       SELECT rank::int, total::float, (SELECT COUNT(*) FROM fallen) AS total
       FROM fallen WHERE user_id = $2`,
      [activeDisciplineId, session.userId]
    );
    const fallenRank = fallenRows[0] ? parseInt(fallenRows[0].rank as unknown as string, 10) : null;
    const fallenTotal = parseInt(fallenRows[0]?.total ?? "0", 10);

    return (
      <main className="min-h-screen bg-[#0a0606] text-white flex flex-col">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl bg-red-950/20" />
          <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-red-950/10 to-transparent" />
        </div>

        <div className="relative z-10 max-w-md mx-auto w-full px-5 pt-6 pb-28">

          {/* TOP BAR */}
          <header className="flex items-center justify-between mb-6">
            <Link href="/profile" className="touch-card flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Сезон {SEASON.number}</span>
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <form action={logout}>
                <button type="submit" className="touch-card w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </header>

          {/* Elimination banner */}
          <div className="mb-5 rounded-[22px] border border-red-900/30 bg-red-950/15 p-5 text-center">
            <div className="w-12 h-12 rounded-2xl border border-red-900/40 bg-red-950/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💀</span>
            </div>
            <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white/80 mb-1">
              Ты выбыл из {cfg.name.toLowerCase()}
            </h1>
            <p className="text-[13px] text-white/40 leading-relaxed">
              Ты не выполнил норму {SEASON.day} дня.<br />
              Survival rank заморожен. Но мир продолжается.
            </p>
          </div>

          {/* Fallen League */}
          <div className="mb-5 rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
                <span className="text-sm">⚰️</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/70">Fallen League · {cfg.name}</p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  {fallenRank ? `#${fallenRank} среди павших · ${cfg.format(fallenTotal)} ${cfg.unit} сегодня` : "Ты единственный в лиге павших"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-5 rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[24px] font-semibold text-white/60">{disciplineSurvival.survived_days}</p>
                <p className="text-[10px] text-white/25 uppercase tracking-[0.1em] mt-1">Дней прожито</p>
              </div>
              <div className="text-center">
                <p className="text-[24px] font-semibold text-white/60">{disciplineSurvival.longest_streak}</p>
                <p className="text-[10px] text-white/25 uppercase tracking-[0.1em] mt-1">Макс. серия</p>
              </div>
            </div>
          </div>

          {/* Live feed (spectator) */}
          <LiveFeed items={feedItems} />

          {/* Events available */}
          {events.length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-2">События</p>
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
                    joined={e.joined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Record CTA — still available */}
          <Link
            href={`/record?d=${activeDisciplineId}`}
            className="touch-card w-full h-14 rounded-[20px] bg-white/[0.06] text-white/60 text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all border border-white/[0.06]"
          >
            Записать результат · {cfg.emoji}
          </Link>

        </div>
      </main>
    );
  }

  // ── NORMAL SCREEN ───────────────────────────────────────────────
  return (
    <main className={`min-h-screen text-white flex flex-col transition-colors duration-700 ${isDead ? "bg-[#110808]" : isEvening && !isDead && danger !== "safe" ? "bg-[#0f0808]" : finalWeekBg ?? "bg-[#0B0B0C]"}`}>

      {/* ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl transition-all duration-1000 ${isRed ? "bg-[#FFB4AB]/[0.08]" : isEvening && !isDead && danger !== "safe" ? "bg-orange-500/[0.04]" : isFinalWeek ? "bg-white/[0.02]" : "bg-white/[0.015]"}`} />
        {isRed && <div className="absolute top-[60px] right-[-80px] w-[300px] h-[300px] bg-red-900/20 rounded-full blur-3xl" />}
        {isEvening && !isDead && danger !== "safe" && !isRed && (
          <div className="absolute bottom-[-80px] right-[-60px] w-[250px] h-[250px] bg-orange-800/15 rounded-full blur-3xl" />
        )}
        {isFinalWeek && !isRed && (
          <div className="absolute top-[40%] left-[-100px] w-[300px] h-[300px] bg-white/[0.02] rounded-full blur-3xl" />
        )}
        {danger === "safe" && <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-green-900/[0.06] rounded-full blur-3xl" />}
      </div>

      <div className="relative z-10 max-w-md mx-auto w-full px-5 pt-6 pb-28">

        {/* TOP BAR */}
        <header className="flex items-center justify-between mb-6">
            <Link href="/profile" className="touch-card flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isRed ? "bg-red-400" : isEvening && !isDead && danger !== "safe" ? "bg-orange-400" : "bg-green-400"}`} />
            <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Сезон {SEASON.number}</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <form action={logout}>
              <button type="submit" className="w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </header>

        {/* RETURN MOMENT — when player comes back after hours away */}
        {hoursAway !== null && hoursAway >= 2 && (
          <div className="mb-5 rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-white/40" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white leading-tight">
                  Ты отсутствовал {hoursAway} {hoursAway >= 5 ? "часов" : "часа"}
                </p>
                <p className="mt-0.5 text-[12px] text-white/35 leading-relaxed">
                  Сезон продолжался без тебя. {rivalsBeaten} игроков уже впереди.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PERSONAL RIVAL HOOK */}
        {rivalJustAhead && stepsToRival !== null && stepsToRival > 0 && stepsToRival < 50000 && (
          <div className="mb-5 rounded-[22px] border border-orange-900/15 bg-orange-950/8 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl border border-orange-900/20 bg-orange-950/15 flex items-center justify-center shrink-0">
                <span className="text-[16px]">🎯</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white leading-tight">
                  До {rivalJustAhead.name.split(/\s+/)[0]} осталось {cfg.format(stepsToRival)} {cfg.unit}
                </p>
                <p className="mt-0.5 text-[12px] text-white/35 leading-relaxed">
                  Обгони его и поднимись в рейтинге
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SURVIVAL HERO */}
        <section className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-1">Твой статус</p>
          <div className="flex items-start justify-between">
            <h2 className="text-[42px] leading-[0.88] tracking-[-0.05em] font-semibold text-[#F5F5F5]">
              {survival.total_survived} дней
            </h2>
            {isRed && (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${isDead ? "border-[#FFB4AB]/30 bg-[#FFB4AB]/[0.08]" : "border-orange-500/20 bg-orange-500/[0.06]"}`}>
                <span className="text-[11px]">{isDead ? "💀" : "⚠️"}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${isDead ? "text-[#FFB4AB]" : "text-orange-300"}`}>
                  {isDead ? "Мёртвая зона" : "Под угрозой"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-white/[0.06] bg-white/[0.03]">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-[11px] text-white/60 font-medium">
                {survival.current_streak} дней подряд
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-white/[0.06] bg-white/[0.03]">
              <Shield className="w-3 h-3 text-white/40" />
              <span className="text-[11px] text-white/60 font-medium">{survival.alive_disciplines} живы</span>
            </div>
          </div>
        </section>

        {/* SEASON PROGRESS */}
        <section className="mb-5">
          <Link href="/profile" className="touch-card block rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4 active:scale-[0.99] transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">Прогресс сезона</p>
              <span className="text-[11px] text-white/40">{daysLeft} дней осталось</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
              <div className="h-full rounded-full bg-white/40 transition-all" style={{ width: `${Math.round((SEASON.day / 30) * 100)}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-white/50">День {SEASON.day} из 30</span>
              <span className="text-[12px] text-white/30">Ты пережил {rivalsBeaten} игроков</span>
            </div>
          </Link>
        </section>

        {/* DANGER / PRESSURE — with breathing animation */}
        {isRed && (
          <section className="mb-5">
            <div className={`rounded-[22px] border border-[#FFB4AB]/15 bg-[#FFB4AB]/[0.04] p-4 ${isRed ? "animate-breathe animate-breathe-glow" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl border border-[#FFB4AB]/20 bg-[#FFB4AB]/[0.08] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#FFB4AB]" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white leading-tight">
                    {isDead
                      ? "Ты ещё ничего не записал сегодня"
                      : "Ты под угрозой вылета"}
                  </p>
                  <p className="mt-1 text-[12px] text-white/35 leading-relaxed">
                    {isDead
                      ? `${totalPlayers - (userRank ?? 1)} человек уже впереди. Каждый час — это места в рейтинге.`
                      : `Осталось ${cfg.format(cfg.target - todayValue)} до нормы. Запиши результат сейчас.`}
                  </p>
                  <Link
                    href={`/record?d=${activeDisciplineId}`}
                    className="touch-card mt-3 inline-flex h-9 px-4 rounded-xl bg-[#FFB4AB] text-[#1a0808] text-[12px] font-semibold items-center gap-1 active:scale-[0.97] transition-all"
                  >
                    Записать результат <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Morning survival moment */}
        {isMorning && justStartedToday && disciplineSurvival && disciplineSurvival.current_streak > 0 && (
          <div className="mb-5 rounded-[22px] border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-emerald-300">Ты пережил {SEASON.day - 1} день</p>
                <p className="text-[12px] text-white/35 mt-0.5">
                  🔥 {disciplineSurvival.current_streak} {disciplineSurvival.current_streak < 5 ? "дня" : "дней"} подряд · Сегодня новый день
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Night reset moment */}
        {isNightReset && (
          <div className="mb-5 rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
                <span className="text-sm">🌙</span>
              </div>
              <div>
                {survivedYesterday ? (
                  <>
                    <p className="text-[14px] font-semibold text-white/70">Ночь пережита</p>
                    <p className="text-[12px] text-white/35 mt-0.5">
                      Ты всё ещё внутри · День {SEASON.day} начался
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[14px] font-semibold text-white/70">Новый день начался</p>
                    <p className="text-[12px] text-white/35 mt-0.5">
                      Вчера: {cfg.format(yesterdayTotal)} {cfg.unit} из {cfg.format(cfg.target)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Final week banner */}
        {isFinalWeek && !isMorning && !isNightReset && (
          <div className="mb-5 rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
                <span className="text-sm">⚡</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/70">
                  {isFinalDays ? "Финальные дни сезона" : "Финальная неделя сезона"}
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  {isFinalDays
                    ? `Осталось ${daysLeft} ${daysLeft === 1 ? "день" : "дня"}. Слабые уже вылетели.`
                    : `Осталось ${daysLeft} дней. Теперь ошибка стоит сезона.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DISCIPLINE TABS */}
        {joinedIds.length > 1 && (
          <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-0.5">
            {joinedIds.map((id) => {
              const tabCfg = DISCIPLINE_CONFIG[id as DisciplineId];
              if (!tabCfg) return null;
              return <DisciplineTab key={id} id={id} cfg={tabCfg} active={id === activeDisciplineId} />;
            })}
          </div>
        )}

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className={`mb-7 ${joinedIds.length === 1 ? "mt-4" : ""}`}>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/30 mb-3">
            {cfg.emoji} {cfg.name} · Сегодня
          </p>

          <div className="leading-none mb-1">
            <span className={[
              "text-[80px] font-semibold tracking-[-0.06em] leading-none transition-colors duration-700",
              isDead ? "text-white/15" : danger === "danger" ? "text-[#FFB4AB]/70" : "text-[#F5F5F5]",
            ].join(" ")}>
              {cfg.format(todayValue)}
            </span>
          </div>

          <p className={[
            "text-[12px] uppercase tracking-[0.2em] font-medium transition-colors",
            isDead ? "text-white/15" : danger === "danger" ? "text-[#FFB4AB]/50" : "text-white/40",
          ].join(" ")}>
            {cfg.heroUnit} · СЕГОДНЯ
          </p>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {isDead ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#FFB4AB]/30 bg-[#FFB4AB]/[0.08]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FFB4AB]" />
                <span className="text-[12px] text-[#FFB4AB] font-semibold uppercase tracking-[0.1em]">Мёртвая зона · День {SEASON.day}</span>
              </div>
            ) : danger === "danger" ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#FFB4AB]/20 bg-[#FFB4AB]/[0.05]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FFB4AB]" />
                <span className="text-[12px] text-[#FFB4AB]/80 font-medium">Под угрозой · День {SEASON.day}</span>
              </div>
            ) : danger === "safe" ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <Shield className="w-3.5 h-3.5 text-white/40" />
                <span className="text-[12px] text-white/60 font-medium">
                  {activeDays > 0 ? `Выжил ${activeDays} ${activeDays < 5 ? "дня" : "дней"}` : "Норма выполнена"}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <span className="text-[12px] text-white/35">День {SEASON.day} из {SEASON.total} · {daysLeft} осталось</span>
              </div>
            )}

            {disciplineSurvival && disciplineSurvival.current_streak > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06]">
                <span className="text-[12px] text-emerald-400 font-semibold">
                  🔥 {disciplineSurvival.current_streak} {disciplineSurvival.current_streak < 5 ? "дня" : "дней"}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── DAILY TARGET ─────────────────────────────────────────── */}
        <section className="mb-5">
          <div className={[
            "rounded-[22px] border p-4 transition-colors",
            isRed ? "border-[#FFB4AB]/10 bg-[#FFB4AB]/[0.02]" : isEvening && !isDead && danger !== "safe" ? "border-orange-500/10 bg-orange-500/[0.02]" : "border-white/[0.08] bg-white/[0.025]",
          ].join(" ")}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] text-white/40 uppercase tracking-[0.14em]">Дневная цель</p>
              <p className="text-[13px] font-semibold text-white/70">
                {cfg.format(todayValue)}
                <span className="text-white/30 font-normal"> / {cfg.format(cfg.target)} {cfg.unit}</span>
              </p>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={[
                  "h-full rounded-full transition-all duration-700",
                  pct >= 100 ? "bg-white/70" : pct >= 40 ? "bg-white/40" : "bg-[#FFB4AB]/50",
                ].join(" ")}
                style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-white/25">
              {pct >= 100 ? "Цель выполнена на сегодня" : pct > 0 ? `${pct}% — осталось ${cfg.format(cfg.target - todayValue)} ${cfg.unit}` : `Нужно ${cfg.format(cfg.target)} ${cfg.unit}`}
            </p>
          </div>
        </section>

        {/* ── PRESSURE ─────────────────────────────────────────────── */}
        <section className="mb-5">
          <div className={[
            "rounded-[22px] border p-4 transition-colors",
            isRed ? "border-[#FFB4AB]/20 bg-[#FFB4AB]/[0.05]" : isEvening && !isDead && danger !== "safe" ? "border-orange-500/15 bg-orange-500/[0.03]" : "border-white/[0.08] bg-white/[0.025]",
          ].join(" ")}>
            <div className="flex items-start gap-3">
              <div className={[
                "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                isRed ? "border-[#FFB4AB]/20 bg-[#FFB4AB]/[0.08]" : isEvening && !isDead && danger !== "safe" ? "border-orange-500/15 bg-orange-500/[0.06]" : "border-white/[0.08] bg-white/[0.04]",
              ].join(" ")}>
                {danger === "safe"
                  ? <Shield className="w-4 h-4 text-white/50" />
                  : <AlertTriangle className={`w-4 h-4 ${isRed ? "text-[#FFB4AB]" : "text-orange-300"}`} />}
              </div>
              <div>
                <p className={`text-[15px] font-semibold leading-tight ${isRed ? "text-white" : "text-white/80"}`}>
                  {eveningUrgency ?? pressureMsg.headline}
                </p>
                <p className="mt-1 text-[12px] text-white/35 leading-relaxed">
                  {isEvening && !isDead && danger !== "safe"
                    ? `Осталось меньше 4 часов. ${pressureMsg.sub}`
                    : pressureMsg.sub}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── LAST SURVIVORS BANNER ────────────────────────────────── */}
        {isLastPhase && (
          <div className="mb-5 rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
                <span className="text-sm">⚔️</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/70">Осталось {aliveCount} выживших</p>
                <p className="text-[11px] text-white/30 mt-0.5">{survivalPct}% от старта сезона</p>
              </div>
            </div>
          </div>
        )}

        {/* ── DEAD VS ALIVE TENSION ────────────────────────────────── */}
        {deadWinning && (
          <div className="mb-5 rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
                <span className="text-sm">⚰️</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/70">Павшие набирают больше выживших</p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  Среднее у павших: {cfg.format(deadAvg)} · У выживших: {cfg.format(aliveAvg)} {cfg.unit}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── REAL RIVALS ──────────────────────────────────────────── */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Рядом с тобой</p>
            <p className="text-[11px] text-white/20">
              {userRank ? `#${userRank} из ${totalPlayers}` : `${totalPlayers} участников`}
            </p>
          </div>

          <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] overflow-hidden">
            {above.map((r) => (
              <Link
                key={r.user_id}
                href={`/user/${r.user_id}`}
                className="touch-card flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <ChevronUp className="w-3 h-3 text-white/20 shrink-0" />
                <span className="text-[11px] text-white/25 w-10 shrink-0">#{r.rank}</span>
                <span className="flex-1 text-[13px] text-white/45 truncate">{r.name.split(/\s+/)[0]}</span>
                <span className="text-[13px] text-white/40 tabular-nums">{cfg.format(parseFloat(r.today_total as unknown as string))}</span>
                {r.days_ahead >= 3 && (
                  <span className="text-[10px] text-white/20 whitespace-nowrap">{r.days_ahead} дн.</span>
                )}
              </Link>
            ))}

            {/* YOU */}
            <div className={[
              "flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]",
              isDead ? "bg-[#FFB4AB]/[0.06]" : "bg-white/[0.05]",
            ].join(" ")}>
              <Minus className="w-3 h-3 text-white/50 shrink-0" />
              <span className="text-[11px] text-white/50 w-10 shrink-0 font-medium">
                {userRank ? `#${userRank}` : "—"}
              </span>
              <span className="flex-1 text-[13px] text-white font-semibold truncate">
                {session.name ?? "Ты"}
              </span>
              <span className={[
                "text-[13px] font-semibold tabular-nums",
                isDead ? "text-[#FFB4AB]/70" : "text-white",
              ].join(" ")}>
                {cfg.format(todayValue)}
              </span>
            </div>

            {below.map((r) => (
              <div key={r.user_id} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0">
                <ChevronDown className="w-3 h-3 text-white/15 shrink-0" />
                <span className="text-[11px] text-white/20 w-10 shrink-0">#{r.rank}</span>
                <span className="flex-1 text-[13px] text-white/30 truncate">{r.name.split(/\s+/)[0]}</span>
                <span className="text-[13px] text-white/25 tabular-nums">{cfg.format(parseFloat(r.today_total as unknown as string))}</span>
              </div>
            ))}

            {above.length === 0 && below.length === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-[12px] text-white/25">Ты единственный участник этой дисциплины</p>
              </div>
            )}
          </div>

          {isRed && userRank && (
            <p className="mt-2 text-[11px] text-[#FFB4AB]/50 text-center">
              Запиши результат — поднимись выше
            </p>
          )}
        </section>

        {/* ── LIVE FEED ────────────────────────────────────────────── */}
        <LiveFeed items={feedItems} />

        {/* ── EVENTS ───────────────────────────────────────────────── */}
        {events.length > 0 && (
          <section className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-2">События</p>
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
                  joined={e.joined}
                />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* ── RECORD CTA ───────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/95 to-transparent">
        <Link
          href={`/record?d=${activeDisciplineId}`}
            className={[
              "touch-card w-full max-w-md mx-auto h-14 rounded-[20px] text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all",
              isDead
                ? "bg-[#FFB4AB] text-[#1a0808] shadow-[0_10px_40px_rgba(255,180,171,0.25)]"
                : "bg-[#F3F3F3] text-black shadow-[0_10px_40px_rgba(255,255,255,0.08)]",
            ].join(" ")}
        >
          {isDead ? <Zap className="w-4 h-4" /> : null}
          ЗАПИСАТЬ РЕЗУЛЬТАТ
          <span className={`text-[13px] ${isDead ? "text-black/40" : "text-black/35"}`}>· {cfg.emoji}</span>
        </Link>
      </div>
    </main>
  );
}
