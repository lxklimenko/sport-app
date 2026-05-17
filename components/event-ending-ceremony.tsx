"use client";

import { useEffect, useState } from "react";
import { Trophy, Users, Skull } from "lucide-react";

interface Theme {
  bg: string;
  glow: string;
  accent: string;
  accentText: string;
  border: string;
  dot: string;
  live: string;
}

interface TopEntry {
  name: string;
  value: number;
  rank: number;
}

export function EventEndingCeremony({
  title,
  emoji,
  top3,
  participantCount,
  aliveCount,
  eliminatedCount,
  userRank,
  userValue,
  theme,
  onDone,
}: {
  title: string;
  emoji: string | null;
  top3: TopEntry[];
  participantCount: number;
  aliveCount: number;
  eliminatedCount: number;
  userRank: number | null;
  userValue: number;
  theme: Theme;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"dark" | "results" | "done">("dark");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("results"), 1500);
    const t2 = setTimeout(() => setPhase("done"), 6000);
    const t3 = setTimeout(() => onDone(), 6500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      {/* Phase 1: DARK — silence */}
      {phase === "dark" && (
        <div className="animate-in fade-in duration-1000 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/30 mb-2">Событие завершено</p>
          <h1 className="text-[28px] font-bold text-white/60">{emoji ?? "📅"} {title}</h1>
        </div>
      )}

      {/* Phase 2: RESULTS */}
      {phase === "results" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-center px-5 max-w-md mx-auto w-full">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/30 mb-6">ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ</p>

          {/* TOP 3 */}
          <div className="space-y-3 mb-8">
            {top3.map((entry, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${theme.border} ${theme.accent.replace("/20", "/[0.06]")}`}
                >
                  <span className="text-[24px] w-10 shrink-0">{medals[i]}</span>
                  <span className="flex-1 text-[16px] font-semibold text-white/80 text-left truncate">
                    {entry.name.split(/\s+/)[0]}
                  </span>
                  <span className="text-[14px] tabular-nums text-white/50 font-semibold">
                    {entry.value.toLocaleString("ru")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Users className="w-4 h-4 text-white/40" />
                <span className="text-[18px] font-bold text-white/70">{participantCount}</span>
              </div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-white/25">Всего</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Trophy className="w-4 h-4 text-emerald-400/60" />
                <span className="text-[18px] font-bold text-emerald-400/70">{aliveCount}</span>
              </div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-white/25">Выжили</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Skull className="w-4 h-4 text-red-400/40" />
                <span className="text-[18px] font-bold text-red-400/60">{eliminatedCount}</span>
              </div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-white/25">Выбыли</p>
            </div>
          </div>

          {/* Your result */}
          {userRank && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${theme.border} ${theme.accent}`}>
              <span className={`text-[14px] font-semibold ${theme.accentText}`}>
                Ты закончил #{userRank}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Phase 3: DONE */}
      {phase === "done" && <div className="animate-out fade-out duration-300" />}
    </div>
  );
}
