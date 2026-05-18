"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import type { FeedItem } from "@/lib/feed";

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "только что";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  return `${Math.floor(diffHours / 24)} дн назад`;
}

function FeedDot({ type }: { type: string }) {
  const color =
    type === "activity"
      ? "bg-green-400"
      : type === "overtake"
      ? "bg-orange-400"
      : type === "danger"
      ? "bg-[#FFB4AB]"
      : type === "join"
      ? "bg-blue-400"
      : type === "survival"
      ? "bg-emerald-400"
      : "bg-white/50";
  return <div className={`w-1.5 h-1.5 rounded-full ${color} mt-2 shrink-0`} />;
}

export function LiveFeed({ items: initialItems }: { items: FeedItem[] }) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const prevFirstId = useRef<number | null>(null);

  useEffect(() => {
    // Detect if a new item appeared at the top
    if (items.length > 0 && prevFirstId.current !== null && items[0].id !== prevFirstId.current) {
      // New item arrived — keep the glow
    }
    prevFirstId.current = items[0]?.id ?? null;
  }, [items]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Poll /api/feed every 15 seconds (only when visible)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const res = await fetch("/api/feed");
        if (res.ok) {
          const data: FeedItem[] = await res.json();
          setItems(data);
        }
      } catch {
        // silent
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mt-5 rounded-[22px] border border-white/[0.03] bg-white/[0.008] backdrop-blur-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
            Сейчас в сезоне
          </p>
        </div>
        <Link
          href="/pulse"
          className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
        >
          Весь пульс →
        </Link>
      </div>

      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
        {items.slice(0, 5).map((item, index) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 ${
              index === 0 ? "opacity-100" : "opacity-70"
            }`}
          >
            <div className="relative shrink-0">
              <FeedDot type={item.type} />
              {index === 0 && (
                <div className="absolute -inset-1 rounded-full bg-green-400/20 animate-ping" />
              )}
            </div>
            <div>
              <p className="text-[13px] text-white/70 leading-snug">{item.message}</p>
              <p className="mt-0.5 text-[11px] text-white/25">
                {timeAgo(item.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>

  );
}
