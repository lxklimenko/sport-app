import Link from "next/link";
import { getFeedByRange, type FeedRange } from "@/lib/feed";
import { generateAtmosphericEvents } from "@/lib/feed-engine";
import { PulseFeed } from "./pulse-feed";

export const dynamic = "force-dynamic";

const RANGE_LABELS: Record<FeedRange, string> = {
  day:   "24 ЧАСА",
  week:  "7 ДНЕЙ",
  month: "30 ДНЕЙ",
};

export default async function PulsePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  // Generate atmospheric events
  await generateAtmosphericEvents();

  const params = await searchParams;
  const range: FeedRange =
    params.range && ["day", "week", "month"].includes(params.range)
      ? (params.range as FeedRange)
      : "day";

  const feed = await getFeedByRange(range, 50);

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-80px] w-[400px] h-[400px] bg-orange-500/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-20">
        {/* TOP BAR */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Discipline</span>
          </Link>
          <Link
            href="/login"
            className="h-9 px-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] text-[12px] text-white/50 flex items-center gap-1 active:scale-[0.98] transition-all"
          >
            Войти
          </Link>
        </header>

        {/* HERO */}
        <section className="mb-6">
          <h1 className="text-[44px] leading-[0.9] tracking-[-0.05em] font-semibold text-[#F5F5F5]">
            Пульс
            <br />
            сезона
          </h1>
          <p className="mt-3 text-[14px] text-white/35 leading-relaxed">
            Кто доминирует, кто падает, кто на грани.
            <br />
            Сезон живёт — даже когда тебя нет.
          </p>
        </section>

        {/* RANGE TABS */}
        <div className="flex items-center gap-1.5 mb-6">
          {(Object.keys(RANGE_LABELS) as FeedRange[]).map((r) => {
            const isActive = r === range;
            return (
              <Link
                key={r}
                href={`/pulse?range=${r}`}
                className={[
                  "px-4 py-2 rounded-xl text-[12px] font-medium transition-all",
                  isActive
                    ? "bg-white/[0.1] text-white border border-white/[0.12]"
                    : "text-white/35 hover:text-white/60",
                ].join(" ")}
              >
                {RANGE_LABELS[r]}
              </Link>
            );
          })}
        </div>

        {/* FEED */}
        <PulseFeed items={feed} range={range} />
      </div>
    </main>
  );
}
