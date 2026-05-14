import Link from "next/link";
import {
  Flame,
  Zap,
  Trophy,
  ChevronRight,
  Shield,
  TrendingUp,
  AlertTriangle,
  Settings,
} from "lucide-react";

const PLAYER = {
  name: "Алексей К.",
  handle: "alex_k",
  division: "БРОНЗА",
  daysAlive: 12,
  streak: 12,
  reputation: 847,
  rank: 43,
  totalPlayers: 4218,
  seasonDay: 12,
  seasonTotal: 30,
  inSeason: false,
  disciplines: [] as string[],
  recentActivity: [
    { text: "Ты набрал 11 240 шагов", time: "Сегодня", type: "success" },
    { text: "Соперник обогнал тебя на 320 шагов", time: "Вчера", type: "danger" },
    { text: "Серия 11 дней — новый рекорд", time: "2 дня назад", type: "milestone" },
  ],
};

function DivisionBadge({ division }: { division: string }) {
  const colors: Record<string, string> = {
    БРОНЗА: "text-[#CD7F32] border-[#CD7F32]/30 bg-[#CD7F32]/[0.08]",
    СЕРЕБРО: "text-[#C0C0C0] border-[#C0C0C0]/30 bg-[#C0C0C0]/[0.08]",
    ЗОЛОТО: "text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/[0.08]",
    ЭЛИТА: "text-[#A8C7FA] border-[#A8C7FA]/30 bg-[#A8C7FA]/[0.08]",
    ЛЕГЕНДА: "text-[#C4EEDB] border-[#C4EEDB]/30 bg-[#C4EEDB]/[0.08]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.1em] ${colors[division] ?? colors["БРОНЗА"]}`}
    >
      <Shield className="w-3 h-3" />
      {division}
    </span>
  );
}

export default function ProfilePage() {
  const p = PLAYER;
  const seasonProgress = Math.round((p.seasonDay / p.seasonTotal) * 100);

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white overflow-hidden relative">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-80px] w-[400px] h-[400px] bg-orange-500/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-20">

        {/* TOP BAR */}
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Discipline</span>
          </Link>
          <button className="w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </header>

        {/* IDENTITY */}
        <section className="flex items-center gap-4 mb-6">
          <div className="relative shrink-0">
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.08] flex items-center justify-center text-3xl select-none">
              🧑‍💻
            </div>
            {p.streak >= 7 && (
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#0B0B0C] border border-white/[0.08] flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[22px] font-semibold tracking-tight leading-none">{p.name}</h1>
              <DivisionBadge division={p.division} />
            </div>
            <p className="mt-1.5 text-sm text-white/40">@{p.handle}</p>
          </div>
        </section>

        {/* STATS ROW */}
        <section className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-3.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[20px] font-bold tracking-tight">{p.streak}</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">серия дней</p>
          </div>

          <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-3.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-[#A8C7FA]" />
              <span className="text-[20px] font-bold tracking-tight">{p.reputation}</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">репутация</p>
          </div>

          <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-3.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="text-[20px] font-bold tracking-tight">#{p.rank}</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">место</p>
          </div>
        </section>

        {/* SEASON CARD */}
        <section className="mb-5">
          {p.inSeason ? (
            <div className="rounded-[22px] border border-green-500/20 bg-green-500/[0.04] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-[11px] uppercase tracking-[0.18em] text-green-400/80 font-medium">
                      Сезон 1 · Активен
                    </p>
                  </div>
                  <p className="mt-1 text-white font-semibold">
                    День {p.seasonDay} из {p.seasonTotal}
                  </p>
                </div>
                <Link
                  href="/season/current"
                  className="h-9 px-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 text-[13px] font-semibold flex items-center gap-1.5"
                >
                  Открыть <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-400"
                  style={{ width: `${seasonProgress}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-white/35">
                {p.seasonTotal - p.seasonDay} дней осталось · {p.totalPlayers} игроков
              </p>
            </div>
          ) : (
            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-medium">
                  Сезон 1 · День {p.seasonDay} из {p.seasonTotal}
                </p>
              </div>

              <p className="text-white font-semibold text-[17px] mb-1">
                Ты ещё не в сезоне
              </p>
              <p className="text-sm text-white/45 mb-4 leading-relaxed">
                {p.totalPlayers.toLocaleString("ru")} игроков уже внутри.
                <br />
                Чем дольше ждёшь — тем сложнее догнать.
              </p>

              {/* Progress bar (season time elapsed) */}
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-4">
                <div
                  className="h-full rounded-full bg-white/30"
                  style={{ width: `${seasonProgress}%` }}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-[#FFB4AB]/20 bg-[#FFB4AB]/[0.04] p-2.5">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FFB4AB] shrink-0" />
                    <p className="text-[11px] text-[#FFB4AB]/80 leading-tight">
                      Осталось {p.seasonTotal - p.seasonDay} дней
                    </p>
                  </div>
                </div>
                <Link
                  href="/onboarding"
                  className="flex-1 h-10 rounded-xl bg-[#F3F3F3] text-black text-[13px] font-semibold flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
                >
                  Войти в сезон <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* DISCIPLINES */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Активные</p>
              <h2 className="mt-0.5 text-[18px] font-semibold tracking-tight">Дисциплины</h2>
            </div>
            <Link
              href="/onboarding"
              className="h-8 px-3 rounded-xl border border-white/[0.06] bg-white/[0.03] text-[12px] text-white/50 flex items-center gap-1"
            >
              Выбрать <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {p.disciplines.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/[0.08] p-5 text-center">
              <p className="text-white/30 text-sm">Ты ещё не выбрал дисциплины</p>
              <p className="text-white/20 text-xs mt-1">
                Войди в сезон, чтобы выбрать
              </p>
            </div>
          ) : null}
        </section>

        {/* RECENT ACTIVITY */}
        <section>
          <div className="mb-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Последние</p>
            <h2 className="mt-0.5 text-[18px] font-semibold tracking-tight">События</h2>
          </div>

          <div className="space-y-2">
            {p.recentActivity.map((item, i) => {
              const dotColor =
                item.type === "success"
                  ? "bg-green-400"
                  : item.type === "danger"
                  ? "bg-[#FFB4AB]"
                  : "bg-[#A8C7FA]";
              return (
                <div
                  key={i}
                  className="rounded-[18px] border border-white/[0.05] bg-white/[0.02] px-4 py-3 flex items-center gap-3"
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/75">{item.text}</p>
                  </div>
                  <p className="text-[11px] text-white/25 shrink-0">{item.time}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* BOTTOM PRESSURE */}
        <div className="mt-8 flex items-center gap-2 justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-white/20" />
          <p className="text-[11px] text-white/20">
            12 твоих соперников уже внутри сезона
          </p>
        </div>

      </div>
    </main>
  );
}
