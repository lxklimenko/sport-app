"use client";

import { useEffect, useState } from "react";
import type { FeedItem, FeedRange } from "@/lib/feed";

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "только что";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? "день" : diffDays < 5 ? "дня" : "дней"} назад`;
}

const TYPE_CONFIG: Record<string, { emoji: string; label: string; bg: string }> = {
  activity: { emoji: "⚡", label: "Активность", bg: "bg-green-500/10 border-green-500/20" },
  overtake: { emoji: "⬆", label: "Обгон", bg: "bg-orange-500/10 border-orange-500/20" },
  danger:   { emoji: "⚠", label: "Под угрозой", bg: "bg-[#FFB4AB]/10 border-[#FFB4AB]/20" },
  join:     { emoji: "👋", label: "Новые", bg: "bg-blue-500/10 border-blue-500/20" },
  survival: { emoji: "💪", label: "Выжившие", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

function EventCard({ item, isNewest }: { item: FeedItem; isNewest: boolean }) {
  const cfg = TYPE_CONFIG[item.type] ?? { emoji: "•", label: "Событие", bg: "bg-white/[0.03] border-white/[0.06]" };

  return (
    <div
      className={`rounded-[20px] border p-3.5 transition-all ${cfg.bg} ${
        isNewest ? "ring-1 ring-green-400/30" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-[16px] shrink-0">
          {cfg.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-medium">
              {cfg.label}
            </span>
            {isNewest && (
              <span className="text-[9px] uppercase tracking-[0.1em] text-green-400/70 font-semibold animate-pulse">
                Новое
              </span>
            )}
          </div>
          <p className="text-[14px] text-white/80 leading-snug">{item.message}</p>
          <p className="mt-1 text-[11px] text-white/30">{timeAgo(item.created_at)}</p>
        </div>
      </div>
    </div>
  );
}

export function PulseFeed({
  items: initialItems,
  range,
}: {
  items: FeedItem[];
  range: FeedRange;
}) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems, range]);

  // Poll /api/feed every 15 seconds (only when visible)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const res = await fetch(`/api/feed?range=${range}&limit=50`);
        if (res.ok) {
          const data: FeedItem[] = await res.json();
          setItems(data);
        }
      } catch {
        // silent
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [range]);

  if (items.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-white/[0.08] p-8 text-center">
        <p className="text-white/30 text-sm">За выбранный период пока нет событий</p>
        <p className="text-white/20 text-xs mt-1">Скоро здесь появится пульс сезона</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, index) => (
        <EventCard key={item.id} item={item} isNewest={index === 0} />
      ))}
    </div>
  );
}
