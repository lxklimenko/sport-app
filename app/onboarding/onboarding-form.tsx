"use client";

import { useState, useTransition } from "react";
import { joinSeasonAction } from "@/app/actions/season";

const DISCIPLINES = [
  {
    id: "steps",
    emoji: "👟",
    name: "Шаги",
    war: "10 000 каждый день",
    stat1: "12 482 уже внутри",
    stat2: "2 184 под угрозой вылета",
    stat2color: "text-[#FFB4AB]",
    locked: false,
    accent: "border-white/[0.12] bg-white/[0.04]",
    accentSelected: "border-white/40 bg-white/[0.07] shadow-[0_0_24px_rgba(255,255,255,0.06)]",
  },
  {
    id: "running",
    emoji: "🏃",
    name: "Бег",
    war: "Событие на 3 дня",
    stat1: "482 уже вошли",
    stat2: "Старт через 6 часов",
    stat2color: "text-orange-300",
    locked: false,
    accent: "border-orange-500/10 bg-orange-500/[0.03]",
    accentSelected: "border-orange-400/50 bg-orange-500/[0.07] shadow-[0_0_24px_rgba(249,115,22,0.1)]",
  },
  {
    id: "burpees",
    emoji: "💥",
    name: "Бёрпи",
    war: "Только для выживших",
    stat1: "Откроется позже",
    stat2: "",
    stat2color: "",
    locked: true,
    accent: "border-white/[0.04] bg-white/[0.018]",
    accentSelected: "",
  },
] as const;

export function OnboardingForm({
  totalPlayers,
  eliminated24h,
  activeNow,
  activeEvents,
}: {
  totalPlayers: number;
  eliminated24h: number;
  activeNow: number;
  activeEvents: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      await joinSeasonAction(Array.from(selected));
    });
  }

  return (
    <div className="relative z-10 max-w-md mx-auto px-5 pt-8 pb-32">

      {/* HEADER */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.7)]" />
        <span className="text-[11px] uppercase tracking-[0.22em] text-white/35 font-medium">
          СЕЗОН 1 ИДЁТ
        </span>
      </div>

      {/* ── WORLD STATS — emotional hook ──────────────────────────── */}
      <section className="mb-8">
        <h1 className="text-[52px] leading-[0.9] tracking-[-0.05em] font-semibold text-[#F5F5F5] mb-6">
          Мир уже
          <br />
          внутри
        </h1>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-3.5">
            <p className="text-[28px] font-bold tracking-tight text-white/90">
              {totalPlayers.toLocaleString("ru")}
            </p>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.12em] mt-1">
              Игроков в сезоне
            </p>
          </div>
          <div className="rounded-[18px] border border-red-900/20 bg-red-950/10 p-3.5">
            <p className="text-[28px] font-bold tracking-tight text-red-400">
              {eliminated24h}
            </p>
            <p className="text-[10px] text-red-400/50 uppercase tracking-[0.12em] mt-1">
              Вылетели за 24ч
            </p>
          </div>
          <div className="rounded-[18px] border border-emerald-900/20 bg-emerald-950/10 p-3.5">
            <p className="text-[28px] font-bold tracking-tight text-emerald-400">
              {activeNow}
            </p>
            <p className="text-[10px] text-emerald-400/50 uppercase tracking-[0.12em] mt-1">
              Прямо сейчас
            </p>
          </div>
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-3.5">
            <p className="text-[28px] font-bold tracking-tight text-white/90">
              {activeEvents}
            </p>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.12em] mt-1">
              Событий активно
            </p>
          </div>
        </div>

        <p className="text-[14px] text-white/40 leading-relaxed">
          {eliminated24h > 0
            ? `${eliminated24h} человек не справились вчера. Слабые исчезают первыми.`
            : `${totalPlayers.toLocaleString("ru")} уже внутри. Каждый день без тебя — их преимущество.`}
        </p>
      </section>

      {/* ── CHOOSE ────────────────────────────────────────────────── */}
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/25 font-medium">
          Где ты хочешь выживать?
        </p>
      </div>

      {/* DISCIPLINE CARDS */}
      <div className="space-y-3">
        {DISCIPLINES.map((d) => {
          const isSelected = selected.has(d.id);
          const isLocked = d.locked;

          return (
            <button
              key={d.id}
              type="button"
              disabled={isLocked}
              onClick={() => !isLocked && toggle(d.id)}
              className={[
                "touch-card w-full text-left rounded-[22px] border p-4 transition-all duration-200",
                isLocked
                  ? `${d.accent} opacity-40 cursor-not-allowed`
                  : isSelected
                  ? d.accentSelected
                  : `${d.accent} active:scale-[0.99]`,
              ].join(" ")}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center text-[22px] shrink-0">
                  {d.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[17px] font-semibold text-white leading-none">
                      {d.name}
                    </p>
                    {isSelected && (
                      <span className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-medium">
                        выбрано
                      </span>
                    )}
                    {isLocked && (
                      <span className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-medium">
                        заперто
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[13px] text-white/45">{d.war}</p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="text-[12px] text-white/50">{d.stat1}</span>
                    {d.stat2 && (
                      <>
                        <span className="text-white/15">·</span>
                        <span className={`text-[12px] ${d.stat2color}`}>{d.stat2}</span>
                      </>
                    )}
                  </div>
                </div>

                {!isLocked && (
                  <div
                    className={[
                      "w-5 h-5 rounded-full border shrink-0 mt-0.5 transition-all",
                      isSelected
                        ? "border-white bg-white"
                        : "border-white/20 bg-transparent",
                    ].join(" ")}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 20 20" fill="none" className="w-full h-full">
                        <path
                          d="M5 10l3.5 3.5L15 7"
                          stroke="#0B0B0C"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* SKIP */}
      <p className="mt-6 text-center text-[12px] text-white/20">
        Можно войти без дисциплин — и выбрать позже
      </p>

      {/* BOTTOM CTA */}
      <div
        className={[
          "fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 transition-all duration-300",
          "bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/95 to-transparent",
          selected.size > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending || selected.size === 0}
          className="touch-card w-full h-14 rounded-[20px] bg-[#F3F3F3] text-black text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all disabled:opacity-60 shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
        >
          {pending ? (
            <span className="opacity-60">Входим...</span>
          ) : (
            <>
              ВОЙТИ В СЕЗОН
              {selected.size > 0 && (
                <span className="text-black/40 text-[13px]">
                  · {selected.size} {selected.size === 1 ? "дисциплина" : "дисциплины"}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
