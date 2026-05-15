import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, TrendingDown, ChevronUp, ChevronDown, Minus, AlertTriangle, Shield } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPool, migrateDatabase } from "@/lib/db";
import { logout } from "@/app/actions/auth";

// ─── config ──────────────────────────────────────────────────────────────────

const SEASON = { number: 1, day: 12, total: 30, players: 4218 };

const DISCIPLINE_CONFIG = {
  steps: {
    emoji: "👟",
    name: "Шаги",
    unit: "шагов",
    target: 10000,
    format: (v: number) => v.toLocaleString("ru"),
    heroUnit: "ШАГОВ",
  },
  running: {
    emoji: "🏃",
    name: "Бег",
    unit: "км",
    target: 5,
    format: (v: number) => v.toFixed(1),
    heroUnit: "КМ",
  },
  burpees: {
    emoji: "💥",
    name: "Бёрпи",
    unit: "повт.",
    target: 50,
    format: (v: number) => String(Math.floor(v)),
    heroUnit: "ПОВТ.",
  },
} as const;

type DisciplineId = keyof typeof DISCIPLINE_CONFIG;

// ─── rivals simulation ───────────────────────────────────────────────────────

const RIVAL_NAMES = [
  "Алекс К.", "Мария С.", "Дима В.", "Катя П.",
  "Игорь М.", "Анна Л.", "Сергей Н.", "Ольга Р.",
];

function buildRivals(disciplineId: DisciplineId, todayValue: number, userName: string) {
  const cfg = DISCIPLINE_CONFIG[disciplineId];
  const pct = Math.min(todayValue / cfg.target, 1.2);
  // rank: 0% done → ~4000, 100% done → ~400
  const userRank = Math.max(1, Math.round(4218 - pct * 3800));

  const pick = (offset: number) => RIVAL_NAMES[(userRank + offset + RIVAL_NAMES.length * 4) % RIVAL_NAMES.length];

  const aboveVal = (mult: number) => Math.round(todayValue + cfg.target * mult);
  const belowVal = (mult: number) => Math.max(0, Math.round(todayValue - cfg.target * mult));

  return {
    userRank,
    above: [
      { name: pick(1), value: aboveVal(0.09), rank: userRank - 2 },
      { name: pick(2), value: aboveVal(0.04), rank: userRank - 1 },
    ],
    below: [
      { name: pick(3), value: belowVal(0.03), rank: userRank + 1 },
      { name: pick(4), value: belowVal(0.08), rank: userRank + 2 },
    ],
    userName,
    userValue: todayValue,
  };
}

// ─── pressure messages ───────────────────────────────────────────────────────

function getPressure(disciplineId: DisciplineId, todayValue: number, userRank: number) {
  const cfg = DISCIPLINE_CONFIG[disciplineId];
  const pct = todayValue / cfg.target;

  if (pct === 0) {
    return {
      icon: "danger",
      headline: `${(userRank - 1).toLocaleString("ru")} человек уже впереди`,
      sub: "Ты ещё ничего не записал сегодня",
    };
  }
  if (pct < 0.5) {
    return {
      icon: "falling",
      headline: "Ты падаешь в рейтинге",
      sub: `Прямо сейчас тебя обгоняют — запиши результат`,
    };
  }
  if (pct < 1) {
    return {
      icon: "close",
      headline: `Осталось ${cfg.format(cfg.target - todayValue)} ${cfg.unit}`,
      sub: "Почти у цели — не останавливайся",
    };
  }
  return {
    icon: "safe",
    headline: "Ты выполнил норму",
    sub: "Сегодня ты в безопасности",
  };
}

// ─── sub-components ─────────────────────────────────────────────────────────

function DisciplineTab({ id, cfg, active }: {
  id: string;
  cfg: typeof DISCIPLINE_CONFIG[DisciplineId];
  active: boolean;
}) {
  return (
    <Link
      href={`/season/current?d=${id}`}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all",
        active
          ? "bg-white/[0.1] text-white border border-white/[0.12]"
          : "text-white/35 hover:text-white/60",
      ].join(" ")}
    >
      <span>{cfg.emoji}</span>
      <span>{cfg.name}</span>
    </Link>
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

  // Fetch user's disciplines
  const disciplinesRes = await db.query(
    "SELECT discipline_id FROM user_disciplines WHERE user_id = $1 ORDER BY joined_at",
    [session.userId]
  );
  const joinedIds = disciplinesRes.rows.map((r: { discipline_id: string }) => r.discipline_id);

  if (joinedIds.length === 0) redirect("/onboarding");

  // Active discipline from URL param or first joined
  const params = await searchParams;
  const requestedId = params.d;
  const activeDisciplineId = (
    requestedId && joinedIds.includes(requestedId) ? requestedId : joinedIds[0]
  ) as DisciplineId;

  const cfg = DISCIPLINE_CONFIG[activeDisciplineId] ?? DISCIPLINE_CONFIG.steps;

  // Today's total for active discipline
  const todayRes = await db.query(
    `SELECT COALESCE(SUM(value), 0) AS total
     FROM activities
     WHERE user_id = $1
       AND discipline_id = $2
       AND recorded_at::date = CURRENT_DATE`,
    [session.userId, activeDisciplineId]
  );
  const todayValue = parseFloat(todayRes.rows[0].total);

  // Days with any activity recorded
  const daysRes = await db.query(
    `SELECT COUNT(DISTINCT recorded_at::date) AS days
     FROM activities
     WHERE user_id = $1`,
    [session.userId]
  );
  const activeDays = parseInt(daysRes.rows[0].days, 10);

  // Derived state
  const progress = Math.min(todayValue / cfg.target, 1);
  const pct = Math.round(progress * 100);
  const survived = activeDays > 0;
  const inDanger = todayValue < cfg.target * 0.5;
  const rivals = buildRivals(activeDisciplineId, todayValue, session.name ?? "Ты");
  const pressure = getPressure(activeDisciplineId, todayValue, rivals.userRank);
  const daysLeft = SEASON.total - SEASON.day;

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white overflow-hidden relative">
      {/* ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-white/[0.015] rounded-full blur-3xl" />
        {inDanger && (
          <div className="absolute top-[80px] right-[-100px] w-[300px] h-[300px] bg-[#FFB4AB]/[0.06] rounded-full blur-3xl" />
        )}
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-28">

        {/* TOP BAR */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/profile" className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Сезон {SEASON.number}</span>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </header>

        {/* DISCIPLINE TABS */}
        {joinedIds.length > 1 && (
          <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-0.5">
            {joinedIds.map((id) => {
              const tabCfg = DISCIPLINE_CONFIG[id as DisciplineId];
              if (!tabCfg) return null;
              return <DisciplineTab key={id} id={id} cfg={tabCfg} active={id === activeDisciplineId} />;
            })}
          </div>
        )}

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className={`mb-8 ${joinedIds.length === 1 ? "mt-4" : ""}`}>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/30 mb-3">
            {cfg.emoji} {cfg.name} · Сегодня
          </p>
          <div className="flex items-end gap-3 leading-none">
            <span className={[
              "font-semibold tracking-[-0.06em] leading-none",
              todayValue === 0
                ? "text-[72px] text-white/20"
                : "text-[72px] text-[#F5F5F5]",
            ].join(" ")}>
              {cfg.format(todayValue)}
            </span>
          </div>
          <p className={[
            "mt-1 text-[13px] uppercase tracking-[0.2em] font-medium",
            todayValue === 0 ? "text-white/20" : "text-white/50",
          ].join(" ")}>
            {cfg.heroUnit} · СЕГОДНЯ
          </p>

          {/* STATUS */}
          <div className="mt-4">
            {survived && activeDays > 0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <Shield className="w-3.5 h-3.5 text-white/40" />
                <span className="text-[12px] text-white/60 font-medium">
                  {activeDays === 1 ? "Первый день выживания" : `Выжил ${activeDays} ${activeDays < 5 ? "дня" : "дней"}`}
                </span>
              </div>
            ) : inDanger ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#FFB4AB]/20 bg-[#FFB4AB]/[0.05]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FFB4AB]" />
                <span className="text-[12px] text-[#FFB4AB]/80 font-medium">Под угрозой · День {SEASON.day}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <span className="text-[12px] text-white/35">День {SEASON.day} из {SEASON.total}</span>
              </div>
            )}
          </div>
        </section>

        {/* ── DAILY TARGET ─────────────────────────────────────────── */}
        <section className="mb-5">
          <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4">
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
                  pct >= 100 ? "bg-white/70" : pct >= 50 ? "bg-white/45" : "bg-[#FFB4AB]/60",
                ].join(" ")}
                style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-white/25">
              {pct >= 100
                ? "Цель выполнена"
                : pct > 0
                ? `${pct}% — осталось ${cfg.format(cfg.target - todayValue)} ${cfg.unit}`
                : `Нужно ${cfg.format(cfg.target)} ${cfg.unit}`}
            </p>
          </div>
        </section>

        {/* ── PRESSURE ─────────────────────────────────────────────── */}
        <section className="mb-5">
          <div className={[
            "rounded-[22px] border p-4",
            pressure.icon === "safe"
              ? "border-white/[0.08] bg-white/[0.025]"
              : "border-[#FFB4AB]/15 bg-[#FFB4AB]/[0.04]",
          ].join(" ")}>
            <div className="flex items-start gap-3">
              <div className={[
                "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                pressure.icon === "safe"
                  ? "border-white/[0.08] bg-white/[0.04]"
                  : "border-[#FFB4AB]/15 bg-[#FFB4AB]/[0.06]",
              ].join(" ")}>
                {pressure.icon === "safe"
                  ? <Shield className="w-4 h-4 text-white/50" />
                  : <TrendingDown className="w-4 h-4 text-[#FFB4AB]" />}
              </div>
              <div>
                <p className={[
                  "text-[15px] font-semibold leading-tight",
                  pressure.icon === "safe" ? "text-white/80" : "text-white",
                ].join(" ")}>
                  {pressure.headline}
                </p>
                <p className="mt-1 text-[12px] text-white/35 leading-relaxed">
                  {pressure.sub}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── RIVALS ───────────────────────────────────────────────── */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Рядом с тобой</p>
            <p className="text-[11px] text-white/25">из {SEASON.players.toLocaleString("ru")}</p>
          </div>

          <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] overflow-hidden">
            {/* above */}
            {rivals.above.map((r) => (
              <div key={r.rank} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04]">
                <div className="w-5 flex items-center justify-center shrink-0">
                  <ChevronUp className="w-3 h-3 text-white/25" />
                </div>
                <span className="text-[11px] text-white/30 w-10 shrink-0">#{r.rank}</span>
                <span className="flex-1 text-[13px] text-white/50">{r.name}</span>
                <span className="text-[13px] text-white/40 font-medium tabular-nums">
                  {cfg.format(r.value)}
                </span>
              </div>
            ))}

            {/* you */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04] border-b border-white/[0.06]">
              <div className="w-5 flex items-center justify-center shrink-0">
                <Minus className="w-3 h-3 text-white/60" />
              </div>
              <span className="text-[11px] text-white/50 w-10 shrink-0 font-medium">#{rivals.userRank}</span>
              <span className="flex-1 text-[13px] text-white font-semibold">
                {rivals.userName}
              </span>
              <span className={[
                "text-[13px] font-semibold tabular-nums",
                todayValue === 0 ? "text-[#FFB4AB]" : "text-white",
              ].join(" ")}>
                {cfg.format(todayValue)}
              </span>
            </div>

            {/* below */}
            {rivals.below.map((r) => (
              <div key={r.rank} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0">
                <div className="w-5 flex items-center justify-center shrink-0">
                  <ChevronDown className="w-3 h-3 text-white/20" />
                </div>
                <span className="text-[11px] text-white/25 w-10 shrink-0">#{r.rank}</span>
                <span className="flex-1 text-[13px] text-white/35">{r.name}</span>
                <span className="text-[13px] text-white/30 font-medium tabular-nums">
                  {cfg.format(r.value)}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-2 text-[11px] text-white/20 text-center">
            {inDanger
              ? `Запиши результат — поднимись выше`
              : `Осталось ${daysLeft} дней в сезоне`}
          </p>
        </section>

      </div>

      {/* ── RECORD CTA ───────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/95 to-transparent">
        <Link
          href={`/record?d=${activeDisciplineId}`}
          className="w-full max-w-md mx-auto h-14 rounded-[20px] bg-[#F3F3F3] text-black text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
        >
          ЗАПИСАТЬ РЕЗУЛЬТАТ
          <span className="text-black/35 text-[13px]">· {cfg.emoji}</span>
        </Link>
      </div>
    </main>
  );
}
