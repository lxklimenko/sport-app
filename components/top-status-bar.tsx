"use client";

import Link from "next/link";
import { Shield, AlertTriangle, ChevronRight } from "lucide-react";

type DangerLevel = "dead" | "danger" | "warning" | "safe";

interface TopStatusBarProps {
  seasonDay: number;
  daysLeft: number;
  danger?: DangerLevel;
  userName?: string | null;
  showProfile?: boolean;
  activeNow?: number;
}

const DANGER_CONFIG: Record<DangerLevel, { icon: string; text: string; color: string; dot: string }> = {
  dead:    { icon: "💀", text: "МЁРТВАЯ ЗОНА", color: "text-[#FFB4AB]", dot: "bg-[#FFB4AB]" },
  danger:  { icon: "⚠️", text: "ПОД УГРОЗОЙ",  color: "text-orange-300", dot: "bg-orange-400" },
  warning: { icon: "⚡", text: "ПОЧТИ НОРМА",   color: "text-yellow-300", dot: "bg-yellow-400" },
  safe:    { icon: "🛡", text: "В БЕЗОПАСНОСТИ", color: "text-emerald-300", dot: "bg-green-400" },
};

export function TopStatusBar({
  seasonDay,
  daysLeft,
  danger,
  userName,
  showProfile = true,
  activeNow,
}: TopStatusBarProps) {
  const dangerCfg = danger ? DANGER_CONFIG[danger] : null;

  return (
    <header className="flex items-center justify-between mb-6">
      {/* Left: season info */}
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${dangerCfg?.dot ?? "bg-green-400"}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/35 font-medium whitespace-nowrap">
              День {seasonDay}
            </span>
            {dangerCfg && (
              <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${dangerCfg.color} whitespace-nowrap`}>
                {dangerCfg.icon} {dangerCfg.text}
              </span>
            )}
          </div>
          {activeNow !== undefined && activeNow > 0 && (
            <p className="text-[9px] text-white/20 mt-0.5 tracking-wide">
              {activeNow} сейчас в сезоне · {daysLeft} дней осталось
            </p>
          )}
        </div>
      </div>

      {/* Right: profile link */}
      {showProfile && (
        <Link
          href="/profile"
          className="h-8 px-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] text-[11px] text-white/50 flex items-center gap-1 active:scale-[0.98] transition-all shrink-0 hover:bg-white/[0.05]"
        >
          {userName ?? "Ты"} <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </header>
  );
}
