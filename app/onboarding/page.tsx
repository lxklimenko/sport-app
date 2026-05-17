import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPool } from "@/lib/db";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  // World stats for emotional hook
  const db = getPool();
  const [totalRes, eliminatedRes, activeRes, eventsRes] = await Promise.all([
    db.query("SELECT COUNT(*)::int AS count FROM users"),
    db.query("SELECT COUNT(*)::int AS count FROM season_feed WHERE type = 'elimination' AND created_at > NOW() - INTERVAL '24 hours'"),
    db.query("SELECT COUNT(DISTINCT user_id)::int AS count FROM activities WHERE recorded_at > NOW() - INTERVAL '5 minutes'"),
    db.query("SELECT COUNT(*)::int AS count FROM season_events WHERE is_active = true AND ends_at > NOW()"),
  ]);

  const totalPlayers = totalRes.rows[0]?.count ?? 0;
  const eliminated24h = eliminatedRes.rows[0]?.count ?? 0;
  const activeNow = activeRes.rows[0]?.count ?? 0;
  const activeEvents = eventsRes.rows[0]?.count ?? 0;

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-80px] w-[400px] h-[400px] bg-orange-500/[0.04] rounded-full blur-3xl" />
      </div>
      <OnboardingForm
        totalPlayers={totalPlayers}
        eliminated24h={eliminated24h}
        activeNow={activeNow}
        activeEvents={activeEvents}
      />
    </main>
  );
}
