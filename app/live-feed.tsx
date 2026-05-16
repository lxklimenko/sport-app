"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
      : type === "danger"
      ? "bg-[#FFB4AB]"
      : "bg-white/50";
  return <div className={`w-1.5 h-1.5 rounded-full ${color} mt-2 shrink-0`} />;
}

export function LiveFeed({ items }: { items: FeedItem[] }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);

    return () => clearInterval(interval);
  }, [router]);

  if (items.length === 0) return null;

  return (
    <section className="mt-5 rounded-[24px] border border-white/[0.03] bg-white/[0.008] backdrop-blur-2xl p-3.5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
            Сейчас в сезоне
          </p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-white">
            Живая лента
          </h2>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <FeedDot type={item.type} />
            <div>
              <p className="text-sm text-white/80">{item.message}</p>
              <p className="mt-0.5 text-xs text-white/30">
                {timeAgo(item.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
