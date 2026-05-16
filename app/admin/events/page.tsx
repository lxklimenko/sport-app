import Link from "next/link";
import { migrateEvents, getAllEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  await migrateEvents();
  const events = await getAllEvents();

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="max-w-2xl mx-auto px-5 pt-8 pb-28">
        <header className="flex items-center justify-between mb-8">
          <div>
            <Link href="/profile" className="text-[11px] text-white/30 hover:text-white/50 uppercase tracking-[0.2em] mb-1 block">
              ← Назад
            </Link>
            <h1 className="text-[22px] font-bold tracking-[-0.02em]">Events Admin</h1>
          </div>
        </header>

        {/* Create form */}
        <form action="/admin/events/create" method="POST" className="mb-10 rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5 space-y-4">
          <p className="text-[13px] font-semibold text-white/70 mb-3">Создать событие</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 uppercase tracking-[0.1em] block mb-1">Название</label>
              <input name="title" required className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-white/20" placeholder="PUSHUP WEEK" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 uppercase tracking-[0.1em] block mb-1">Slug</label>
              <input name="slug" required className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-white/20" placeholder="pushup-week" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 uppercase tracking-[0.1em] block mb-1">Дисциплина</label>
              <select name="discipline" required className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-white/20">
                <option value="steps">👟 Шаги</option>
                <option value="running">🏃 Бег</option>
                <option value="burpees">💥 Бёрпи</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/40 uppercase tracking-[0.1em] block mb-1">Режим</label>
              <select name="mode" required className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-white/20">
                <option value="daily_survival">Daily Survival</option>
                <option value="total_score">Total Score</option>
                <option value="speed_run">Speed Run</option>
                <option value="last_man_standing">Last Man Standing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-[0.1em] block mb-1">Описание</label>
            <textarea name="description" rows={2} className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-[13px] text-white outline-none focus:border-white/20 resize-none" placeholder="100 отжиманий каждый день. 7 дней. Не пропусти ни одного." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 uppercase tracking-[0.1em] block mb-1">Старт</label>
              <input name="starts_at" type="datetime-local" required className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-white/20" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 uppercase tracking-[0.1em] block mb-1">Конец</label>
              <input name="ends_at" type="datetime-local" required className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-white/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 uppercase tracking-[0.1em] block mb-1">Дневная цель</label>
              <input name="daily_target" type="number" className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-white/20" placeholder="100" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 uppercase tracking-[0.1em] block mb-1">Общая цель</label>
              <input name="total_target" type="number" className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-white/20" placeholder="700" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 uppercase tracking-[0.1em] block mb-1">Emoji</label>
              <input name="emoji" className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-white/20" placeholder="⚡" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 uppercase tracking-[0.1em] block mb-1">Цвет бейджа</label>
              <input name="badge_color" className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-white/20" placeholder="#FF6B35" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input name="is_survival" type="checkbox" value="true" className="w-4 h-4 rounded bg-white/[0.04] border border-white/[0.08]" />
              <span className="text-[12px] text-white/50">Survival режим</span>
            </label>
            <label className="flex items-center gap-2">
              <input name="allow_eliminated" type="checkbox" value="true" defaultChecked className="w-4 h-4 rounded bg-white/[0.04] border border-white/[0.08]" />
              <span className="text-[12px] text-white/50">Доступно павшим</span>
            </label>
          </div>

          <button type="submit" className="w-full h-12 rounded-[16px] bg-[#F3F3F3] text-black text-[13px] font-semibold active:scale-[0.985] transition-all">
            Создать событие
          </button>
        </form>

        {/* Events list */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-3">Все события ({events.length})</p>
          {events.length === 0 ? (
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.018] p-5 text-center">
              <p className="text-[13px] text-white/30">Событий пока нет</p>
            </div>
          ) : (
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.018] overflow-hidden">
              {events.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
                  <span className="text-sm">{e.emoji ?? "📅"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/70 font-medium truncate">{e.title}</p>
                    <p className="text-[11px] text-white/30">
                      {e.is_active ? "🔴 LIVE" : "⏳"} · {e.discipline} · {e.mode}
                    </p>
                  </div>
                  <span className="text-[11px] text-white/25 whitespace-nowrap">
                    {new Date(e.starts_at).toLocaleDateString("ru")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
