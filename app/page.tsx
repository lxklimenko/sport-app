import Link from "next/link";
import { getLiveFeed } from "@/lib/feed";
import { LiveFeed } from "./live-feed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const feed = await getLiveFeed(20);
  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-220px] left-1/2 -translate-x-1/2 w-[820px] h-[820px] bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-[-320px] right-[-100px] w-[520px] h-[520px] bg-orange-500/[0.05] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-14">
        {/* TOP BAR */}
        <header className="flex items-center justify-between">
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

        {/* HERO */}
        <section className="pt-14">
          <div className="max-w-[420px]">
            <h1 className="text-[58px] sm:text-[68px] leading-[0.92] tracking-[-0.07em] font-semibold text-[#F5F5F5]">
              НЕ
              <br />
              СДАЙСЯ
            </h1>
            <p className="mt-5 text-[16px] leading-7 text-white/50 max-w-sm">
              Выбирай дисциплины.
              <br />
              Выживай каждый день.
              <br />
              Не дай себя обогнать.
            </p>
          </div>

          {/* LIVE STATUS */}
          <div className="mt-8">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.7)]" />
              <p className="text-sm text-white/60">4 218 сейчас в сезоне</p>
            </div>
            <p className="mt-1.5 text-xs text-white/50 ml-[10px]">
              День 12 продолжается
            </p>
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/signup"
              className="w-full h-13 rounded-[20px] bg-[#F3F3F3] text-black text-[14px] font-semibold flex items-center justify-center active:scale-[0.985] transition-all shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
            >
              ВОЙТИ В СЕЗОН
            </Link>
            <p className="mt-3 text-[11px] text-white/25 text-center leading-relaxed">
              Ты можешь не успеть
            </p>
          </div>

          {/* STATS */}
          <div className="mt-8 flex items-center gap-6">
            <div>
              <p className="text-lg font-bold tracking-tight text-white">12 482</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/30">
                в сезоне
              </p>
            </div>
            <div className="w-px h-8 bg-white/[0.06]" />
            <div>
              <p className="text-lg font-bold tracking-tight text-white">18</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/30">
                дней осталось
              </p>
            </div>
            <div className="w-px h-8 bg-white/[0.06]" />
            <div>
              <p className="text-lg font-bold tracking-tight text-white">4</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/30">
                дисциплины
              </p>
            </div>
          </div>
        </section>

        {/* DISCIPLINES */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
              Дисциплины сезона
            </p>
            <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-white">
              Игроки уже внутри
            </h2>
          </div>

          <div className="space-y-2.5">
            {/* STEPS */}
            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-3.5 shadow-[0_0_30px_rgba(255,255,255,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-[20px] shrink-0">
                  👟
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-white leading-none">Шаги</p>
                  <p className="mt-1 text-xs text-white/50">10 000 шагов каждый день</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-medium text-[#FFB4AB]">2 184 под угрозой</p>
                  <p className="text-[10px] text-white/25 mt-0.5">вылета сегодня</p>
                </div>
              </div>
            </div>

            {/* RUNNING */}
            <div className="rounded-[22px] border border-orange-500/10 bg-orange-500/[0.03] backdrop-blur-2xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/[0.08] flex items-center justify-center text-[20px] shrink-0">
                  🏃
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-white leading-none">Бег</p>
                  <p className="mt-1 text-xs text-orange-200/75">Старт через 6 часов</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-medium text-orange-300">482 уже вошли</p>
                  <p className="text-[10px] text-white/25 mt-0.5">мест осталось мало</p>
                </div>
              </div>
            </div>

            {/* BURPEES */}
            <div className="rounded-[22px] border border-white/[0.04] bg-white/[0.018] backdrop-blur-2xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-[20px] shrink-0">
                  💥
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-white leading-none">Бёрпи</p>
                  <p className="mt-1 text-xs text-white/50">Скоро откроется</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-medium text-white/40">Только для</p>
                  <p className="text-[11px] font-medium text-white/40">выживших</p>
                </div>
              </div>
            </div>

            {/* CYCLING */}
            <div className="rounded-[22px] border border-white/[0.04] bg-white/[0.018] backdrop-blur-2xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-[20px] shrink-0">
                  🚴
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-white leading-none">Велосипед</p>
                  <p className="mt-1 text-xs text-white/50">Сезонная дисциплина</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-medium text-white/30">Сезон</p>
                  <p className="text-[11px] font-medium text-white/30">1 · Активен</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE FEED */}
        <LiveFeed items={feed} />
      </div>
    </main>
  );
}
