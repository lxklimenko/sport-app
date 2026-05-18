import Link from "next/link";
import { getFeedByRange, type FeedRange } from "@/lib/feed";
import { generateAtmosphericEvents } from "@/lib/feed-engine";
import { PulseFeed } from "./pulse-feed";
import { getSession } from "@/lib/session";
import { NotificationBell } from "@/components/notification-bell";

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

  const [feed, session] = await Promise.all([
    getFeedByRange(range, 100),
    getSession(),
  ]);

  const isLoggedIn = !!session.userId;

  return (
    <main className="min-h-screen bg-[#080808] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-80px] w-[400px] h-[400px] bg-red-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-20">
        {/* TOP BAR */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Discipline</span>
          </Link>
          {isLoggedIn ? (
            <NotificationBell />
          ) : (
            <Link
              href="/login"
              className="touch-card h-9 px-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] text-[12px] text-white/50 flex items-center gap-1 active:scale-[0.98] transition-all"
            >
              Войти
            </Link>
          )}
        </header>

        {/* HERO — raw, fast, chaotic */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-orange-300/60 font-semibold">
              RAW STREAM
            </span>
          </div>
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
                  "touch-card px-4 py-2 rounded-xl text-[12px] font-medium transition-all",
                  isActive
                    ? "bg-orange-500/[0.15] text-orange-200 border border-orange-500/20"
                    : "text-white/35 hover:text-white/60",
                ].join(" ")}
              >
                {RANGE_LABELS[r]}
              </Link>
            );
          })}
        </div>

        {/* FEED — raw stream */}
        <PulseFeed items={feed} range={range} />
      </div>
    </main>
  );
}

