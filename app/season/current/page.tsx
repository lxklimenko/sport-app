import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, AlertTriangle, Shield, ChevronUp, ChevronDown, Minus, Zap } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPool, migrateDatabase } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { Pool } from "pg";

// ─── config ──────────────────────────────────────────────────────────────────

const SEASON = { number: 1, day: 12, total: 30 };

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
  return rows;
}

type FeedItem = { text: string; sub: string; dot: "red" | "orange" | "green" | "white" };

async function getLiveFeed(db: Pool, disciplineId: string): Promise<FeedItem[]> {
  // Real recent activities (last 2 hours, other users)
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

  // Count of users at risk today (0 activity)
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

  // Real items
  for (const row of recentRows) {
    const cfg = DISCIPLINE_CONFIG[row.discipline_id as DisciplineId];
    if (!cfg) continue;
    const mins = parseInt(row.minutes_ago, 10);
    const timeAgo = mins < 1 ? "только что" : `${mins} мин назад`;
    const shortName = row.name.trim().split(/\s+/)[0]; // first name only
    feed.push({
      text: `${shortName} записал ${cfg.format(parseFloat(row.value))} ${cfg.unit}`,
      sub: timeAgo,
      dot: "green",
    });
  }

  // Static atmospheric items
  if (atRisk > 0) {
    feed.push({
      text: `${atRisk.toLocaleString("ru")} ${atRisk === 1 ? "участник" : "участников"} ещё ничего не записали`,
      sub: "сегодня",
      dot: "red",
    });
  }

  feed.push({
    text: `Сезон ${SEASON.number} · День ${SEASON.day} из ${SEASON.total}`,
    sub: `${SEASON.total - SEASON.day} дней до конца`,
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
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all",
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

  // Parallel data fetch
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
    getLiveFeed(db, activeDisciplineId),
  ]);

  const todayValue = parseFloat(todayRes.rows[0].total);
  const activeDays = parseInt(daysRes.rows[0].days, 10);
  const danger = getDangerLevel(todayValue, cfg.target);
  const progress = Math.min(todayValue / cfg.target, 1);
  const pct = Math.round(progress * 100);
  const daysLeft = SEASON.total - SEASON.day;

  // Find user row in rivals
  const userRivalRow = rivalsRows.find((r) => r.user_id === session.userId);
  const userRank = userRivalRow ? parseInt(userRivalRow.rank as unknown as string, 10) : null;
  const above = rivalsRows.filter((r) => userRank && parseInt(r.rank as unknown as string, 10) < userRank);
  const below = rivalsRows.filter((r) => userRank && parseInt(r.rank as unknown as string, 10) > userRank);

  // Total participants
  const totalRes = await db.query<{ count: string }>(
    "SELECT COUNT(*) FROM user_disciplines WHERE discipline_id = $1",
    [activeDisciplineId]
  );
  const totalPlayers = parseInt(totalRes.rows[0].count, 10);

  // Pressure message
  const pressureMsg =
    danger === "dead"
      ? { headline: `${((userRank ?? 2) - 1).toLocaleString("ru")} человек уже впереди тебя`, sub: "Ты ещё ничего не записал сегодня. Каждый час — это места в рейтинге." }
      : danger === "danger"
      ? { headline: "Ты падаешь в рейтинге прямо сейчас", sub: `Осталось ${cfg.format(cfg.target - todayValue)} ${cfg.unit} до нормы — запиши сейчас.` }
      : danger === "warning"
      ? { headline: `Осталось ${cfg.format(cfg.target - todayValue)} ${cfg.unit}`, sub: "Почти у цели — не останавливайся." }
      : { headline: "Ты выполнил норму на сегодня", sub: "Ты в безопасности. Можно добавить ещё." };

  // Visual theme by danger
  const isDead = danger === "dead";
  const isRed = danger === "dead" || danger === "danger";

  return (
    <main className={`min-h-screen text-white flex flex-col transition-colors duration-700 ${isDead ? "bg-[#110808]" : "bg-[#0B0B0C]"}`}>

      {/* ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl transition-all duration-1000 ${isRed ? "bg-[#FFB4AB]/[0.08]" : "bg-white/[0.015]"}`} />
        {isRed && <div className="absolute top-[60px] right-[-80px] w-[300px] h-[300px] bg-red-900/20 rounded-full blur-3xl" />}
        {danger === "safe" && <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-green-900/[0.06] rounded-full blur-3xl" />}
      </div>

      <div className="relative z-10 max-w-md mx-auto w-full px-5 pt-6 pb-28">

        {/* TOP BAR */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/profile" className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isRed ? "bg-red-400" : "bg-green-400"}`} />
            <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Сезон {SEASON.number}</span>
          </Link>
          <form action={logout}>
            <button type="submit" className="w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </header>

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

          {/* Big number */}
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

          {/* STATUS BADGE */}
          <div className="mt-4">
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
          </div>
        </section>

        {/* ── DAILY TARGET ─────────────────────────────────────────── */}
        <section className="mb-5">
          <div className={[
            "rounded-[22px] border p-4 transition-colors",
            isRed ? "border-[#FFB4AB]/10 bg-[#FFB4AB]/[0.02]" : "border-white/[0.08] bg-white/[0.025]",
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
            isRed ? "border-[#FFB4AB]/20 bg-[#FFB4AB]/[0.05]" : "border-white/[0.08] bg-white/[0.025]",
          ].join(" ")}>
            <div className="flex items-start gap-3">
              <div className={[
                "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                isRed ? "border-[#FFB4AB]/20 bg-[#FFB4AB]/[0.08]" : "border-white/[0.08] bg-white/[0.04]",
              ].join(" ")}>
                {danger === "safe"
                  ? <Shield className="w-4 h-4 text-white/50" />
                  : <AlertTriangle className={`w-4 h-4 ${isRed ? "text-[#FFB4AB]" : "text-orange-300"}`} />}
              </div>
              <div>
                <p className={`text-[15px] font-semibold leading-tight ${isRed ? "text-white" : "text-white/80"}`}>
                  {pressureMsg.headline}
                </p>
                <p className="mt-1 text-[12px] text-white/35 leading-relaxed">{pressureMsg.sub}</p>
              </div>
            </div>
          </div>
        </section>

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
              <div key={r.user_id} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04]">
                <ChevronUp className="w-3 h-3 text-white/20 shrink-0" />
                <span className="text-[11px] text-white/25 w-10 shrink-0">#{r.rank}</span>
                <span className="flex-1 text-[13px] text-white/45 truncate">{r.name.split(/\s+/)[0]}</span>
                <span className="text-[13px] text-white/40 tabular-nums">{cfg.format(parseFloat(r.today_total as unknown as string))}</span>
              </div>
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

      </div>

      {/* ── RECORD CTA ───────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/95 to-transparent">
        <Link
          href={`/record?d=${activeDisciplineId}`}
          className={[
            "w-full max-w-md mx-auto h-14 rounded-[20px] text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all",
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
