"use client";

import { useEffect, useState } from "react";
import { Trophy, Shield, TrendingUp } from "lucide-react";

interface Theme {
  bg: string;
  glow: string;
  accent: string;
  accentText: string;
  border: string;
  dot: string;
  live: string;
}

type VictoryType = "top10" | "target_done" | "survived_day";

const VICTORY_CONFIG: Record<VictoryType, { icon: typeof Trophy; title: string; subtitle: string }> = {
  top10:        { icon: Trophy, title: "TOP 10", subtitle: "Ты вошёл в элиту события" },
  target_done:  { icon: Shield, title: "Цель выполнена", subtitle: "Ты переживёшь этот день" },
  survived_day: { icon: TrendingUp, title: "День пережит", subtitle: "Ещё один день позади" },
};

export function EventVictoryMoment({
  type,
  rank,
  theme,
  onDone,
}: {
  type: VictoryType;
  rank?: number | null;
  theme: Theme;
  onDone: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const cfg = VICTORY_CONFIG[type];
  const Icon = cfg.icon;

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 text-center">
        <div className={`w-20 h-20 rounded-[28px] border ${theme.border} ${theme.accent} flex items-center justify-center mx-auto mb-5`}>
          <Icon className={`w-9 h-9 ${theme.accentText}`} />
        </div>
        <h1 className={`text-[32px] font-bold tracking-[-0.03em] ${theme.accentText} mb-2`}>
          {cfg.title}
        </h1>
        <p className="text-[14px] text-white/50 mb-4">{cfg.subtitle}</p>
        {rank && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${theme.border} ${theme.accent}`}>
            <span className={`text-[20px] font-bold ${theme.accentText}`}>#{rank}</span>
          </div>
        )}
      </div>
    </div>
  );
}
