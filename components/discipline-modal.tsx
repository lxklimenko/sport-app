"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

// ─── discipline config with psychology ───────────────────────────────────────

type DisciplineMeta = {
  id: string;
  emoji: string;
  name: string;
  unit: string;
  target: number;
  tagline: string;
  vibe: string;
  psychology: string[];
  whatYouFeel: string[];
  stakes: string;
  color: string;
  gradient: string;
  glowColor: string;
};

const DISCIPLINES_META: Record<string, DisciplineMeta> = {
  steps: {
    id: "steps",
    emoji: "👟",
    name: "Шаги",
    unit: "шагов",
    target: 10000,
    tagline: "Долгая война",
    vibe: "Выживание",
    psychology: [
      "10 000 шагов каждый день.",
      "Пропустил день — выбыл.",
      "Выжившие доходят до финальной недели.",
      "Остальные смотрят, как ты падаешь.",
    ],
    whatYouFeel: [
      "Ежедневное давление — норма не исчезает",
      "Страх вылета — одно пропущенное утро решает всё",
      "Rivalries — кто-то дышит в спину",
      "Финальная неделя — слабые уже вылетели",
    ],
    stakes: "Из 12 482 игроков выжило только 3 218",
    color: "border-white/[0.12]",
    gradient: "from-white/[0.04] to-transparent",
    glowColor: "rgba(255,255,255,0.06)",
  },
  running: {
    id: "running",
    emoji: "🏃",
    name: "Бег",
    unit: "км",
    target: 5,
    tagline: "Рывок",
    vibe: "Событие",
    psychology: [
      "Кто пробежит больше всех за 3 дня.",
      "Это не марафон — это спринт.",
      "Павшие тоже могут участвовать.",
      "Победитель поднимается в рейтинге сезона.",
    ],
    whatYouFeel: [
      "Адреналин старта — всего 3 дня",
      "Каждый километр приближает к топу",
      "Даже павшие могут вернуться в игру",
      "Рывок, а не война на истощение",
    ],
    stakes: "482 уже вошли · Старт через 6 часов",
    color: "border-orange-500/20",
    gradient: "from-orange-500/[0.06] to-transparent",
    glowColor: "rgba(249,115,22,0.1)",
  },
  burpees: {
    id: "burpees",
    emoji: "💥",
    name: "Бёрпи",
    unit: "повт.",
    target: 50,
    tagline: "Жестокое испытание",
    vibe: "Хардкор",
    psychology: [
      "100 бёрпи каждый день.",
      "Слабые вылетают быстро.",
      "Остаются только те, кто готов страдать.",
      "Это не для всех. Это для тех, кто хочет доказать.",
    ],
    whatYouFeel: [
      "Каждое повторение — это преодоление",
      "Боль в мышцах напоминает, что ты жив",
      "Ты один на один с собой",
      "После недели бёрпи ты уже не тот человек",
    ],
    stakes: "Только для выживших · Откроется позже",
    color: "border-purple-500/20",
    gradient: "from-purple-500/[0.06] to-transparent",
    glowColor: "rgba(168,85,247,0.1)",
  },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return n.toLocaleString("ru");
}

// ─── modal ───────────────────────────────────────────────────────────────────

export function DisciplineModal({
  disciplineId,
  onClose,
  onJoin,
  totalPlayers,
  aliveCount,
  atRisk,
}: {
  disciplineId: string;
  onClose: () => void;
  onJoin?: () => void;
  totalPlayers?: number;
  aliveCount?: number;
  atRisk?: number;
}) {
  const meta = DISCIPLINES_META[disciplineId];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  if (!meta) return null;

  const deadCount = totalPlayers && aliveCount !== undefined
    ? totalPlayers - aliveCount
    : null;

  const survivalPct = totalPlayers && aliveCount !== undefined
    ? Math.round((aliveCount / totalPlayers) * 100)
    : null;

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={[
          "relative w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px]",
          "bg-[#0B0B0C] border border-white/[0.06]",
          "overflow-hidden transition-all duration-300 ease-out",
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0",
        ].join(" ")}
        style={{
          maxHeight: "90vh",
          boxShadow: `0 0 80px ${meta.glowColor}`,
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
          style={{ background: meta.glowColor }}
        />

        <div className="relative z-10 overflow-y-auto max-h-[90vh]">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ── HEADER ─────────────────────────────────────────────── */}
          <div className={`pt-10 pb-6 px-6 bg-gradient-to-b ${meta.gradient}`}>
            <div className="w-16 h-16 rounded-2xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-[32px] mx-auto mb-4">
              {meta.emoji}
            </div>
            <h2 className="text-[28px] font-bold tracking-[-0.03em] text-center text-white">
              {meta.name}
            </h2>
            <p className="mt-1 text-[13px] text-white/40 text-center uppercase tracking-[0.15em]">
              {meta.tagline}
            </p>
          </div>

          {/* ── PSYCHOLOGY ─────────────────────────────────────────── */}
          <div className="px-6 py-5 space-y-3">
            {meta.psychology.map((line, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1 h-1 rounded-full bg-white/20 mt-[7px] shrink-0" />
                <p className="text-[14px] text-white/70 leading-relaxed">{line}</p>
              </div>
            ))}
          </div>

          {/* ── DIVIDER ────────────────────────────────────────────── */}
          <div className="mx-6 h-px bg-white/[0.04]" />

          {/* ── WHAT YOU FEEL ──────────────────────────────────────── */}
          <div className="px-6 py-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-3">
              Что ты почувствуешь
            </p>
            <div className="space-y-2.5">
              {meta.whatYouFeel.map((feeling, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[13px] text-white/20 shrink-0">•</span>
                  <p className="text-[13px] text-white/50 leading-relaxed">{feeling}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── DIVIDER ────────────────────────────────────────────── */}
          <div className="mx-6 h-px bg-white/[0.04]" />

          {/* ── STATS ──────────────────────────────────────────────── */}
          <div className="px-6 py-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-3">
              Статистика
            </p>

            {totalPlayers && (
              <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.015] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-white/50">Всего в дисциплине</span>
                  <span className="text-[15px] font-semibold text-white/80">
                    {formatNum(totalPlayers)}
                  </span>
                </div>

                {aliveCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-white/50">Выжило</span>
                    <span className="text-[15px] font-semibold text-green-400">
                      {formatNum(aliveCount)}
                    </span>
                  </div>
                )}

                {deadCount !== null && deadCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-white/50">Вылетело</span>
                    <span className="text-[15px] font-semibold text-[#FFB4AB]">
                      {formatNum(deadCount)}
                    </span>
                  </div>
                )}

                {survivalPct !== null && (
                  <div className="pt-2 border-t border-white/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-white/30">Выживаемость</span>
                      <span className={`text-[13px] font-semibold ${
                        survivalPct < 30 ? "text-[#FFB4AB]" : "text-green-400"
                      }`}>
                        {survivalPct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${survivalPct}%`,
                          background: survivalPct < 30
                            ? "linear-gradient(90deg, #FFB4AB, #FF6B6B)"
                            : "linear-gradient(90deg, #4ade80, #22c55e)",
                        }}
                      />
                    </div>
                  </div>
                )}

                {atRisk !== undefined && atRisk > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                    <span className="text-[13px] text-white/50">Под угрозой сегодня</span>
                    <span className="text-[14px] font-semibold text-orange-300">
                      {formatNum(atRisk)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {!totalPlayers && (
              <p className="text-[13px] text-white/30">{meta.stakes}</p>
            )}
          </div>

          {/* ── CTA ────────────────────────────────────────────────── */}
          <div className="sticky bottom-0 px-6 pb-8 pt-4 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/95 to-transparent">
            {onJoin ? (
              <button
                onClick={() => {
                  onJoin();
                  handleClose();
                }}
                className="touch-card w-full h-14 rounded-[20px] bg-[#F3F3F3] text-black text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
              >
                ВОЙТИ В ДИСЦИПЛИНУ
                <span className="text-black/40 text-[13px]">· {meta.emoji}</span>
              </button>
            ) : (
              <Link
                href={`/season/current?d=${meta.id}`}
                className="touch-card w-full h-14 rounded-[20px] bg-[#F3F3F3] text-black text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
              >
                ПЕРЕЙТИ К ДИСЦИПЛИНЕ
                <span className="text-black/40 text-[13px]">· {meta.emoji}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
