import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, LogOut, ChevronRight, TrendingDown, TrendingUp, Trophy, Skull, Zap, Flame } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPool, migrateDatabase } from "@/lib/db";
import { DisciplineCard } from "./discipline-card";
import { logout } from "@/app/actions/auth";
import { migrateEvents } from "@/lib/events";
import { getCurrentSeason } from "@/lib/season";

const DISCIPLINE_META: Record<string, { emoji: string; name: string; goal: string }> = {
  steps:   { emoji: "👟", name: "Шаги",    goal: "10 000 шагов каждый день" },
  running: { emoji: "🏃", name: "Бег",     goal: "Событие на 3 дня" },
  burpees: { emoji: "💥", name: "Бёрпи",   goal: "Только для выживших" },
};

const MONTHS_RU = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function buildHeatmapColumns(activeDays: Set<string>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(today);

  const origin = new Date(today);
  origin.setDate(today.getDate() - 16 * 7 + 1);
  const dow = origin.getDay();
  const shift = dow === 0 ? -6 : 1 - dow;
  origin.setDate(origin.getDate() + shift);

  const columns: Array<{
    monthLabel: string | null;
    cells: Array<{ str: string; isActive: boolean; isToday: boolean; isFuture: boolean }>;
  }> = [];

  const cur = new Date(origin);
  let lastMonth = -1;

  while (cur <= today) {
    const cells = [];
    const monthLabel = cur.getMonth() !== lastMonth ? MONTHS_RU[cur.getMonth()] : null;
    if (cur.getMonth() !== lastMonth) lastMonth = cur.getMonth();

    for (let d = 0; d < 7; d++) {
      const str = toDateStr(cur);
      cells.push({
        str,
        isActive: activeDays.has(str),
        isToday: str === todayStr,
        isFuture: cur > today,
      });
      cur.setDate(cur.getDate() + 1);
      if (cur > today && d < 6) {
        for (let f = d + 1; f < 7; f++) cells.push({ str: "future", isActive: false, isToday: false, isFuture: true });
        break;
      }
    }
    columns.push({ monthLabel, cells });
  }

  return columns;
}

// ─── Survival Status ────────────────────────────────────────────────────────

function SurvivalStatus({
  totalSurvived,
  eventsCount,
  currentStreak,
  aliveDisciplines,
}: {
  totalSurvived: number;
  eventsCount: number;
  currentStreak: number;
  aliveDisciplines: number;
}) {
  const stats = [
    { icon: "🔥", label: "дней внутри", value: totalSurvived },
    { icon: "⚔️", label: "Пережил событий", value: eventsCount },
    { icon: "💀", label: "Не вылетал дней", value: currentStreak },
    { icon: "🩸", label: "Последние выживших", value: aliveDisciplines },
  ];

  return (
    <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-3">Статус выживания</p>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[16px]">{s.icon}</span>
              <span className="text-[20px] font-semibold text-white/90 tabular-nums">{s.value}</span>
            </div>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.08em]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Survival Timeline ──────────────────────────────────────────────────────

function SurvivalTimeline({
  day,
  total,
  daysLeft,
  playersBeaten,
}: {
  day: number;
  total: number;
  daysLeft: number;
  playersBeaten: number;
}) {
  const progress = Math.round((day / total) * 100);

  return (
    <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-3">Survival Timeline</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-white/70">День {day} из {total}</span>
          <span className="text-[11px] text-white/30">{progress}%</span>
        </div>

        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full bg-white/40 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 text-center">
            <p className="text-[13px] font-semibold text-white/80">{daysLeft}</p>
            <p className="text-[9px] text-white/25 uppercase tracking-[0.08em] mt-0.5">Дней до конца сезона</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 text-center">
            <p className="text-[13px] font-semibold text-white/80">{playersBeaten.toLocaleString("ru")}</p>
            <p className="text-[9px] text-white/25 uppercase tracking-[0.08em] mt-0.5">Ты пережил игроков</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type HeatmapCol = ReturnType<typeof buildHeatmapColumns>[number];

function Heatmap({ columns }: { columns: HeatmapCol[] }) {
  const activeTotalDays = columns.reduce(
    (acc, col) => acc + col.cells.filter((c) => c.isActive).length,
    0
  );

  return (
    <section className="mb-5">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Активность</p>
          <h2 className="mt-0.5 text-[18px] font-semibold tracking-tight">
            {activeTotalDays > 0 ? `${activeTotalDays} дней записано` : "История выживания"}
          </h2>
        </div>
        <p className="text-[11px] text-white/20">16 нед</p>
      </div>

      <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-4 overflow-x-auto">
        <div className="flex gap-[3px] mb-1.5">
          {columns.map((col, i) => (
            <div key={i} className="w-[10px] shrink-0">
              {col.monthLabel && (
                <span className="text-[8px] text-white/25 leading-none whitespace-nowrap" style={{ fontSize: "7px" }}>
                  {col.monthLabel}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-[3px]">
          {columns.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-[3px] shrink-0">
              {col.cells.map((cell, di) => (
                <div
                  key={di}
                  className={[
                    "w-[10px] h-[10px] rounded-[2px] transition-colors",
                    cell.isFuture
                      ? "opacity-0"
                      : cell.isActive
                      ? "bg-white/65"
                      : cell.isToday
                      ? "bg-white/[0.14] ring-1 ring-inset ring-white/30"
                      : "bg-white/[0.05]",
                  ].join(" ")}
                />
              ))}
            </div>
          ))}
        </div>

        {activeTotalDays === 0 && (
          <p className="mt-3 text-[11px] text-white/20 text-center">
            Записывай активность — здесь появится твоя история
          </p>
        )}
      </div>
    </section>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  await migrateDatabase();
  await migrateEvents();
  const db = getPool();

  const SEASON = await getCurrentSeason();

  const [disciplinesRes, activitiesRes, eventsRes, survivalRes, rivalsRes, eventsCountRes, totalPlayersRes] = await Promise.all([
    db.query("SELECT discipline_id FROM user_disciplines WHERE user_id = $1 ORDER BY joined_at", [session.userId]),
    db.query(
      `SELECT recorded_at::date::text AS day
       FROM activities
       WHERE user_id = $1 AND recorded_at >= NOW() - INTERVAL '16 weeks'
       GROUP BY day`,
      [session.userId]
    ),
    db.query(
      `SELECT e.id, e.title, e.emoji, e.discipline, e.starts_at, e.ends_at, e.is_active, e.slug
       FROM season_events e
       JOIN event_participants ep ON ep.event_id = e.id
       WHERE ep.user_id = $1 AND e.ends_at > NOW()
       ORDER BY e.starts_at ASC`,
      [session.userId]
    ),
    db.query(
      `SELECT
         COALESCE(SUM(survived_days), 0)::int AS total_survived,
         COALESCE(MAX(longest_streak), 0)::int AS best_streak,
         COALESCE(MAX(current_streak), 0)::int AS current_streak,
         COALESCE(SUM(CASE WHEN is_alive = true THEN 1 ELSE 0 END), 0)::int AS alive_disciplines
       FROM user_survival
       WHERE user_id = $1`,
      [session.userId]
    ),
    db.query(
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
    db.query(
      `SELECT COUNT(*)::int AS count
       FROM event_participants
       WHERE user_id = $1`,
      [session.userId]
    ),
    db.query<{ count: string }>("SELECT COUNT(*)::int AS count FROM users"),
  ]);

  const joinedIds: string[] = disciplinesRes.rows.map((r) => r.discipline_id);
  const activeDays = new Set<string>(activitiesRes.rows.map((r: { day: string }) => r.day));
  const inSeason = joinedIds.length > 0;
  const heatmapColumns = buildHeatmapColumns(activeDays);
  const myEvents = eventsRes.rows;

  const survival = survivalRes.rows[0] ?? { total_survived: 0, best_streak: 0, current_streak: 0, alive_disciplines: 0 };
  const rivalsBeaten = parseInt(rivalsRes.rows[0]?.beaten ?? "0", 10);
  const eventsCount = parseInt(eventsCountRes.rows[0]?.count ?? "0", 10);
  const totalPlayers = parseInt(totalPlayersRes.rows[0]?.count ?? "0", 10);

  const name = session.name ?? "Игрок";
  const initials = name.slice(0, 1).toUpperCase();
  const handle = name.toLowerCase().replace(/\s+/g, "_");
  const daysLeft = SEASON.total - SEASON.day;

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl bg-white/[0.03]" />
        <div className="absolute bottom-[-200px] right-[-80px] w-[400px] h-[400px] rounded-full blur-3xl bg-orange-500/[0.04]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-20">

        {/* TOP BAR */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Discipline</span>
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

        {/* IDENTITY */}
        <section className="flex items-center gap-3.5 mb-7">
          <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.08] flex items-center justify-center text-xl font-bold text-white/60 select-none shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[20px] font-semibold tracking-tight leading-none">{name}</h1>
              {inSeason && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/[0.08]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-green-400">
                    Внутри
                  </span>
                </span>
              )}
            </div>
            <p className="mt-1 text-[12px] text-white/30">@{handle}</p>
          </div>
        </section>

        {/* SURVIVAL STATUS */}
        {inSeason && (
          <section className="mb-6">
            <SurvivalStatus
              totalSurvived={survival.total_survived}
              eventsCount={eventsCount}
              currentStreak={survival.current_streak}
              aliveDisciplines={survival.alive_disciplines}
            />
          </section>
        )}

        {/* SURVIVAL TIMELINE */}
        {inSeason && (
          <section className="mb-6">
            <SurvivalTimeline
              day={SEASON.day}
              total={SEASON.total}
              daysLeft={daysLeft}
              playersBeaten={rivalsBeaten}
            />
          </section>
        )}

        {/* HERO */}
        <section className="mb-7">
          {inSeason ? (
            <Link href="/season/current" className="block active:opacity-80 transition-opacity">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-2">
                Ты в сезоне {SEASON.number}
              </p>
              <h2 className="text-[48px] leading-[0.88] tracking-[-0.05em] font-semibold text-[#F5F5F5]">
                Выжил<br />{SEASON.day} дней
              </h2>
              <p className="mt-3 text-[14px] text-white/35 leading-relaxed">
                Осталось {daysLeft} — не останавливайся.
              </p>
            </Link>
          ) : (
            <Link href="/onboarding" className="block active:opacity-80 transition-opacity">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-2">
                Сезон {SEASON.number} идёт
              </p>
              <h2 className="text-[48px] leading-[0.88] tracking-[-0.05em] font-semibold text-[#F5F5F5]">
                Ты ещё<br />не внутри
              </h2>
              <p className="mt-3 text-[14px] text-white/35 leading-relaxed">
                {totalPlayers.toLocaleString("ru")} уже в игре.
                <br />
                Каждый день без тебя — их преимущество.
              </p>
            </Link>
          )}
        </section>

        {/* SEASON STATUS */}
        <section className="mb-5">
          <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-medium">
                Сезон {SEASON.number} · День {SEASON.day} из {SEASON.total}
              </p>
            </div>

            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-3">
              <div className="h-full rounded-full bg-white/30 transition-all" style={{ width: `${Math.round((SEASON.day / SEASON.total) * 100)}%` }} />
            </div>

            {inSeason ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
                  <p className="text-[12px] text-white/50 leading-tight">
                    {joinedIds.length} {joinedIds.length === 1 ? "дисциплина" : "дисциплины"} активно
                  </p>
                </div>
                <Link
                  href="/season/current"
                  className="flex-1 h-10 rounded-xl bg-[#F3F3F3] text-black text-[13px] font-semibold flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
                >
                  В бой <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <Link
                href="/onboarding"
                className="w-full h-10 rounded-xl bg-[#F3F3F3] text-black text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
              >
                Войти в сезон <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </section>

        {/* DISCIPLINES */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Твои</p>
              <h2 className="mt-0.5 text-[18px] font-semibold tracking-tight">Дисциплины</h2>
            </div>
            {inSeason && (
              <Link
                href="/onboarding"
                className="h-8 px-3 rounded-xl border border-white/[0.06] bg-white/[0.03] text-[12px] text-white/50 flex items-center gap-1"
              >
                Изменить <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {inSeason ? (
            <div className="space-y-2.5">
              {joinedIds.map((id) => {
                const meta = DISCIPLINE_META[id];
                if (!meta) return null;
                return (
                  <DisciplineCard
                    key={id}
                    id={id}
                    emoji={meta.emoji}
                    name={meta.name}
                    goal={meta.goal}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/[0.08] p-5 text-center">
              <p className="text-white/30 text-sm">Ты ещё не выбрал дисциплины</p>
              <p className="text-white/20 text-xs mt-1">Войди в сезон, чтобы начать</p>
            </div>
          )}
        </section>

        {/* MY EVENTS */}
        {myEvents.length > 0 && (
          <section className="mb-5">
            <div className="mb-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Твои</p>
              <h2 className="mt-0.5 text-[18px] font-semibold tracking-tight">События</h2>
            </div>
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.018] overflow-hidden">
              {myEvents.map((e: any) => {
                const isLive = new Date(e.starts_at) <= new Date() && new Date(e.ends_at) > new Date();
                const endsIn = Math.round((new Date(e.ends_at).getTime() - Date.now()) / 3600000);
                return (
                  <Link
                    key={e.id}
                    href={`/events/${e.slug}`}
                    className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-lg">{e.emoji ?? "📅"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-white/80 font-medium truncate">{e.title}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        {isLive ? (
                          <span className="text-green-400">🔴 LIVE · осталось {endsIn} ч</span>
                        ) : (
                          <span>Скоро</span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className="text-[11px] text-white/40">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ACTIVITY HEATMAP */}
        <Heatmap columns={heatmapColumns} />

        {/* PRESSURE */}
        <section className="rounded-[22px] border border-white/[0.06] bg-white/[0.018] p-4">
          {inSeason ? (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFB4AB]/[0.08] border border-[#FFB4AB]/10 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4 text-[#FFB4AB]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white leading-tight">
                  2 184 человека обгоняют тебя
                </p>
                <p className="mt-1 text-[12px] text-white/35 leading-relaxed">
                  Запиши активность сегодня — иначе разрыв вырастет.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/[0.08] border border-orange-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white leading-tight">
                  {totalPlayers.toLocaleString("ru")} игроков уже набирают очки
                </p>
                <p className="mt-1 text-[12px] text-white/35 leading-relaxed">
                  Ты пока нет. День {SEASON.day} продолжается.
                </p>
              </div>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
