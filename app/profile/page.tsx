import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Flame,
  Zap,
  Trophy,
  ChevronRight,
  Shield,
  TrendingUp,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";

const SEASON = {
  number: 1,
  day: 12,
  total: 30,
  players: 4218,
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
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.1em] ${colors[division] ?? colors["БРОНЗА"]}`}>
      <Shield className="w-3 h-3" />
      {division}
    </span>
  );
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const name = session.name ?? "Игрок";
  const handle = name.toLowerCase().replace(/\s+/g, "_");
  const initials = name.slice(0, 1).toUpperCase();

  const progress = Math.round((SEASON.day / SEASON.total) * 100);

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-80px] w-[400px] h-[400px] bg-orange-500/[0.04] rounded-full blur-3xl" />
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
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </header>

        {/* IDENTITY */}
        <section className="flex items-center gap-4 mb-6">
          <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.08] flex items-center justify-center text-2xl font-bold text-white/60 select-none shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[22px] font-semibold tracking-tight leading-none">{name}</h1>
              <DivisionBadge division="БРОНЗА" />
            </div>
            <p className="mt-1.5 text-sm text-white/40">@{handle}</p>
          </div>
        </section>

        {/* STATS ROW */}
        <section className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-3.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[20px] font-bold tracking-tight">0</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">серия дней</p>
          </div>
          <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-3.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-[#A8C7FA]" />
              <span className="text-[20px] font-bold tracking-tight">0</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">репутация</p>
          </div>
          <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-3.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="text-[20px] font-bold tracking-tight">—</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">место</p>
          </div>
        </section>

        {/* SEASON CARD */}
        <section className="mb-5">
          <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-medium">
                Сезон {SEASON.number} · День {SEASON.day} из {SEASON.total}
              </p>
            </div>

            <p className="text-white font-semibold text-[17px] mb-1">
              Ты ещё не в сезоне
            </p>
            <p className="text-sm text-white/45 mb-4 leading-relaxed">
              {SEASON.players.toLocaleString("ru")} игроков уже внутри.
              <br />
              Чем дольше ждёшь — тем сложнее догнать.
            </p>

            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-4">
              <div className="h-full rounded-full bg-white/30" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-[#FFB4AB]/20 bg-[#FFB4AB]/[0.04] p-2.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#FFB4AB] shrink-0" />
                  <p className="text-[11px] text-[#FFB4AB]/80 leading-tight">
                    Осталось {SEASON.total - SEASON.day} дней
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
          <div className="rounded-[22px] border border-dashed border-white/[0.08] p-5 text-center">
            <p className="text-white/30 text-sm">Ты ещё не выбрал дисциплины</p>
            <p className="text-white/20 text-xs mt-1">Войди в сезон, чтобы начать</p>
          </div>
        </section>

        {/* PRESSURE */}
        <div className="mt-6 flex items-center gap-2 justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-white/20" />
          <p className="text-[11px] text-white/20">
            Игроки уже набирают очки — ты пока нет
          </p>
        </div>

      </div>
    </main>
  );
}
