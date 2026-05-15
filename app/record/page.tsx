import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPool, migrateDatabase } from "@/lib/db";
import { RecordForm } from "./record-form";

const DISCIPLINE_META: Record<string, { emoji: string; name: string }> = {
  steps:   { emoji: "👟", name: "Шаги" },
  running: { emoji: "🏃", name: "Бег" },
  burpees: { emoji: "💥", name: "Бёрпи" },
};

export default async function RecordPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  await migrateDatabase();
  const db = getPool();

  const params = await searchParams;
  const disciplineId = params.d ?? "steps";

  if (!Object.keys(DISCIPLINE_META).includes(disciplineId)) redirect("/season/current");

  // Check enrollment
  const enrolled = await db.query(
    "SELECT 1 FROM user_disciplines WHERE user_id = $1 AND discipline_id = $2",
    [session.userId, disciplineId]
  );
  if (enrolled.rows.length === 0) redirect("/onboarding");

  // Today's total for context
  const todayRes = await db.query(
    `SELECT COALESCE(SUM(value), 0) AS total
     FROM activities
     WHERE user_id = $1 AND discipline_id = $2 AND recorded_at::date = CURRENT_DATE`,
    [session.userId, disciplineId]
  );
  const todayTotal = parseFloat(todayRes.rows[0].total);

  const meta = DISCIPLINE_META[disciplineId];

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white flex flex-col">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto w-full px-5 pt-6 pb-8 flex flex-col flex-1">

        {/* TOP BAR */}
        <header className="flex items-center gap-3 mb-10">
          <Link
            href={`/season/current?d=${disciplineId}`}
            className="w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[20px]">{meta.emoji}</span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 leading-none">Записать</p>
              <p className="text-[16px] font-semibold leading-tight">{meta.name}</p>
            </div>
          </div>
        </header>

        {/* HERO TEXT */}
        <div className="mb-10">
          <h1 className="text-[44px] leading-[0.9] tracking-[-0.05em] font-semibold text-[#F5F5F5]">
            Записать
            <br />
            результат
          </h1>
        </div>

        {/* FORM */}
        <RecordForm disciplineId={disciplineId} todayTotal={todayTotal} />

      </div>
    </main>
  );
}
