import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white overflow-hidden relative">
      {/* Ambient background */}
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
        <section className="pt-20">
          <div className="max-w-[420px]">
            <h1 className="text-[78px] sm:text-[92px] leading-[0.84] tracking-[-0.08em] font-semibold text-[#F5F5F5]">
              НЕ
              <br />
              СДАЙСЯ
            </h1>

            <p className="mt-6 text-[17px] leading-7 text-white/32 max-w-sm">
              Один сезон.
              <br />
              Несколько дисциплин.
              <br />
              Каждый день решает.
            </p>
          </div>

          {/* LIVE STATUS */}
          <div className="mt-10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.7)]" />
              <p className="text-sm text-white/60">4 218 сейчас в сезоне</p>
            </div>
            <p className="mt-1.5 text-xs text-white/25 ml-[10px]">
              День 12 продолжается
            </p>
          </div>

          {/* CTA */}
          <div className="mt-16">
            <Link
              href="/signup"
              className="w-full h-14 rounded-[22px] bg-[#F3F3F3] text-black text-[15px] font-semibold flex items-center justify-center active:scale-[0.985] transition-all shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
            >
              ВОЙТИ В СЕЗОН
            </Link>
            <p className="mt-3 text-[11px] text-white/25 text-center leading-relaxed">
              Войти можно только во время активного сезона
            </p>
          </div>

          {/* STATS */}
          <div className="mt-10 flex items-center gap-6">
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
        <section className="mt-14">
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
              Дисциплины сезона
            </p>
            <h2 className="mt-1 text-[24px] font-semibold tracking-tight text-white">
              Что идёт сейчас
            </h2>
          </div>

          <div className="space-y-3">
            <div className="rounded-[28px] border border-white/[0.05] bg-white/[0.025] backdrop-blur-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center text-[24px]">
                  👟
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-white">STEP SURVIVAL</p>
                  <p className="text-xs text-white/35">10 000 шагов каждый день</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-orange-500/10 bg-orange-500/[0.03] backdrop-blur-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/[0.08] flex items-center justify-center text-[24px]">
                  🏃
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-white">RUN EVENT</p>
                  <p className="text-xs text-orange-200/60">Старт через 6 часов</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.04] bg-white/[0.018] backdrop-blur-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center text-[24px]">
                  💥
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-white">BURPEE WAR</p>
                  <p className="text-xs text-white/35">Скоро откроется</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.04] bg-white/[0.018] backdrop-blur-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center text-[24px]">
                  🚴
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-white">CYCLING LEAGUE</p>
                  <p className="text-xs text-white/35">Сезонная дисциплина</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE FEED */}
        <section className="mt-6 rounded-[24px] border border-white/[0.03] bg-white/[0.008] backdrop-blur-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
                Сейчас в сезоне
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-white">
                Живая лента
              </h2>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-2" />
              <div>
                <p className="text-sm text-white/80">RUN EVENT стартует через 6 часов</p>
                <p className="mt-1 text-xs text-white/30">482 участника уже вошли</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 mt-2" />
              <div>
                <p className="text-sm text-white/80">214 человек потеряли серию сегодня</p>
                <p className="mt-1 text-xs text-white/30">3 минуты назад</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-300 mt-2" />
              <div>
                <p className="text-sm text-white/80">Maria вошла в TOP 10 бега</p>
                <p className="mt-1 text-xs text-white/30">8 минут назад</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
