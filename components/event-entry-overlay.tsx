"use client";

import { useEffect, useState } from "react";
import { Zap, Users, Skull } from "lucide-react";

interface Theme {
  bg: string;
  glow: string;
  accent: string;
  accentText: string;
  border: string;
  dot: string;
  live: string;
}

export function EventEntryOverlay({
  title,
  emoji,
  participantCount,
  theme,
  onDone,
}: {
  title: string;
  emoji: string | null;
  participantCount: number;
  theme: Theme;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"enter" | "info" | "done">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("info"), 1200);
    const t2 = setTimeout(() => setPhase("done"), 3200);
    const t3 = setTimeout(() => onDone(), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      {/* Phase 1: ENTER — big emoji + title */}
      {phase === "enter" && (
        <div className="animate-in fade-in zoom-in-95 duration-700 text-center">
          <div className="text-[80px] mb-4">{emoji ?? "🔥"}</div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-2">Ты вошёл в</p>
          <h1 className={`text-[36px] font-bold tracking-[-0.03em] ${theme.accentText}`}>
            {title}
          </h1>
        </div>
      )}

      {/* Phase 2: INFO — stakes */}
      {phase === "info" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-2xl border ${theme.border} ${theme.accent} flex items-center justify-center mx-auto mb-2`}>
                <Users className={`w-5 h-5 ${theme.accentText}`} />
              </div>
              <p className="text-[24px] font-bold text-white">{participantCount}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">Участников</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl border border-red-900/30 bg-red-950/20 flex items-center justify-center mx-auto mb-2">
                <Skull className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-[24px] font-bold text-red-400">?</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">Выживут</p>
            </div>
          </div>
          <p className="text-[13px] text-white/40">Выживут не все.</p>
        </div>
      )}

      {/* Phase 3: DONE — fade out */}
      {phase === "done" && (
        <div className="animate-out fade-out duration-300" />
      )}
    </div>
  );
}
