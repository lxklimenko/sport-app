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

const TYPE_CONFIG: Record<string, { emoji: string; label: string; bg: string; dot: string }> = {
  activity: { emoji: "⚡", label: "Активность", bg: "bg-green-500/8 border-green-500/15", dot: "bg-green-400" },
  overtake: { emoji: "⬆", label: "Обгон", bg: "bg-orange-500/8 border-orange-500/15", dot: "bg-orange-400" },
  danger:   { emoji: "⚠", label: "Под угрозой", bg: "bg-[#FFB4AB]/8 border-[#FFB4AB]/15", dot: "bg-[#FFB4AB]" },
  join:     { emoji: "👋", label: "Новые", bg: "bg-blue-500/8 border-blue-500/15", dot: "bg-blue-400" },
  survival: { emoji: "💪", label: "Выжившие", bg: "bg-emerald-500/8 border-emerald-500/15", dot: "bg-emerald-400" },
};

function EventCard({ item, isNewest }: { item: FeedItem; isNewest: boolean }) {
  const cfg = TYPE_CONFIG[item.type] ?? { emoji: "•", label: "Событие", bg: "bg-white/[0.02] border-white/[0.06]", dot: "bg-white/40" };

  return (
    <div
      className={`rounded-[16px] border p-3 transition-all ${cfg.bg} ${
        isNewest ? "ring-1 ring-orange-400/20" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-2 h-2 rounded-full ${cfg.dot} mt-1.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-medium">
              {cfg.label}
            </span>
            {isNewest && (
              <span className="text-[8px] uppercase tracking-[0.1em] text-orange-400/70 font-semibold animate-pulse">
                Сейчас
              </span>
            )}
          </div>
          <p className="text-[13px] text-white/75 leading-snug">{item.message}</p>
          <p className="mt-0.5 text-[10px] text-white/25">{timeAgo(item.created_at)}</p>
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
