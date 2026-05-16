import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getNotifications, migrateNotifications } from "@/lib/notifications";
import { NotificationsList } from "./notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  await migrateNotifications();
  const notifications = await getNotifications(session.userId, 50);

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-20">
        {/* TOP BAR */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Discipline</span>
          </Link>
          <Link
            href="/season/current"
            className="h-9 px-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] text-[12px] text-white/50 flex items-center gap-1 active:scale-[0.98] transition-all"
          >
            В сезон
          </Link>
        </header>

        {/* HERO */}
        <section className="mb-6">
          <h1 className="text-[44px] leading-[0.9] tracking-[-0.05em] font-semibold text-[#F5F5F5]">
            Уведомления
          </h1>
          <p className="mt-3 text-[14px] text-white/35 leading-relaxed">
            Кто обогнал, кто догоняет, кто на грани.
          </p>
        </section>

        {/* LIST */}
        <NotificationsList initialNotifications={notifications} />
      </div>
    </main>
  );
}
