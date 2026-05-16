"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SeasonEvent } from "@/lib/events";

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<SeasonEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Edit modal state
  const [editingEvent, setEditingEvent] = useState<SeasonEvent | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const res = await fetch("/admin/events/api");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      // silent
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/admin/events/create", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        router.refresh();
        form.reset();
        await loadEvents();
      } else {
        const data = await res.json();
        setError(data.error || "Ошибка при создании события");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setPending(false);
    }
  }

  function openEdit(event: SeasonEvent) {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      slug: event.slug,
      discipline: event.discipline,
      mode: event.mode,
      description: event.description ?? "",
      starts_at: event.starts_at.slice(0, 16),
      ends_at: event.ends_at.slice(0, 16),
      daily_target: event.daily_target ?? "",
      total_target: event.total_target ?? "",
      is_survival: event.is_survival,
      allow_eliminated: event.allow_eliminated,
      badge_color: event.badge_color ?? "",
      emoji: event.emoji ?? "",
      is_active: event.is_active,
    });
    setEditError(null);
  }

  async function handleEditSave() {
    if (!editingEvent) return;
    setEditPending(true);
    setEditError(null);

    try {
      const body: any = {};
      for (const [key, value] of Object.entries(editForm)) {
        if (key === "daily_target" || key === "total_target") {
          body[key] = value === "" ? null : Number(value);
        } else if (key === "is_survival" || key === "allow_eliminated" || key === "is_active") {
          body[key] = Boolean(value);
        } else if (key === "starts_at" || key === "ends_at") {
          body[key] = new Date(value as string).toISOString();
        } else {
          body[key] = value === "" ? null : value;
        }
      }

      const res = await fetch(`/admin/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setEditingEvent(null);
        await loadEvents();
      } else {
        const data = await res.json();
        setEditError(data.error || "Ошибка при обновлении");
      }
    } catch {
      setEditError("Ошибка сети");
    } finally {
      setEditPending(false);
    }
  }

  async function handleDelete(event: SeasonEvent) {
    if (!confirm(`Удалить событие "${event.title}"?`)) return;

    try {
      const res = await fetch(`/admin/events/${event.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadEvents();
      }
    } catch {
      // silent
    }
  }

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

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-[16px] border border-red-500/20 bg-red-500/[0.06] p-4">
            <p className="text-[13px] text-red-300">{error}</p>
          </div>
        )}

        {/* Create form */}
        <form onSubmit={handleSubmit} className="mb-10 rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5 space-y-4">
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

          <button
            type="submit"
            disabled={pending}
            className="w-full h-12 rounded-[16px] bg-[#F3F3F3] text-black text-[13px] font-semibold active:scale-[0.985] transition-all disabled:opacity-50"
          >
            {pending ? "Создаём..." : "Создать событие"}
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
                  <button
                    onClick={() => openEdit(e)}
                    className="text-[11px] text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(e)}
                    className="text-[11px] text-red-400/50 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/[0.06]"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setEditingEvent(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] bg-[#0B0B0C] border border-white/[0.06] max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold text-white">Редактировать</h2>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="w-8 h-8 rounded-xl border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70"
                >
                  ✕
                </button>
              </div>

              {editError && (
                <div className="rounded-[12px] border border-red-500/20 bg-red-500/[0.06] p-3">
                  <p className="text-[12px] text-red-300">{editError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-1">Название</label>
                  <input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[12px] text-white outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-1">Slug</label>
                  <input value={editForm.slug} onChange={(e) => setEditForm({...editForm, slug: e.target.value})} className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[12px] text-white outline-none focus:border-white/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-1">Дисциплина</label>
                  <select value={editForm.discipline} onChange={(e) => setEditForm({...editForm, discipline: e.target.value})} className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[12px] text-white outline-none focus:border-white/20">
                    <option value="steps">👟 Шаги</option>
                    <option value="running">🏃 Бег</option>
                    <option value="burpees">💥 Бёрпи</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-1">Режим</label>
                  <select value={editForm.mode} onChange={(e) => setEditForm({...editForm, mode: e.target.value})} className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[12px] text-white outline-none focus:border-white/20">
                    <option value="daily_survival">Daily Survival</option>
                    <option value="total_score">Total Score</option>
                    <option value="speed_run">Speed Run</option>
                    <option value="last_man_standing">Last Man Standing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-1">Описание</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} rows={2} className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-[12px] text-white outline-none focus:border-white/20 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-1">Старт</label>
                  <input value={editForm.starts_at} onChange={(e) => setEditForm({...editForm, starts_at: e.target.value})} type="datetime-local" className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[12px] text-white outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-1">Конец</label>
                  <input value={editForm.ends_at} onChange={(e) => setEditForm({...editForm, ends_at: e.target.value})} type="datetime-local" className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[12px] text-white outline-none focus:border-white/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-1">Дневная цель</label>
                  <input value={editForm.daily_target} onChange={(e) => setEditForm({...editForm, daily_target: e.target.value})} type="number" className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[12px] text-white outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-1">Общая цель</label>
                  <input value={editForm.total_target} onChange={(e) => setEditForm({...editForm, total_target: e.target.value})} type="number" className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[12px] text-white outline-none focus:border-white/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-1">Emoji</label>
                  <input value={editForm.emoji} onChange={(e) => setEditForm({...editForm, emoji: e.target.value})} className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[12px] text-white outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] block mb-1">Цвет</label>
                  <input value={editForm.badge_color} onChange={(e) => setEditForm({...editForm, badge_color: e.target.value})} className="w-full h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 text-[12px] text-white outline-none focus:border-white/20" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editForm.is_survival} onChange={(e) => setEditForm({...editForm, is_survival: e.target.checked})} className="w-4 h-4 rounded bg-white/[0.04] border border-white/[0.08]" />
                  <span className="text-[11px] text-white/50">Survival</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editForm.allow_eliminated} onChange={(e) => setEditForm({...editForm, allow_eliminated: e.target.checked})} className="w-4 h-4 rounded bg-white/[0.04] border border-white/[0.08]" />
                  <span className="text-[11px] text-white/50">Павшим</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})} className="w-4 h-4 rounded bg-white/[0.04] border border-white/[0.08]" />
                  <span className="text-[11px] text-white/50">Активно</span>
                </label>
              </div>

              <button
                onClick={handleEditSave}
                disabled={editPending}
                className="w-full h-12 rounded-[16px] bg-[#F3F3F3] text-black text-[13px] font-semibold active:scale-[0.985] transition-all disabled:opacity-50"
              >
                {editPending ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
