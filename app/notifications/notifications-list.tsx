"use client";

import { useEffect, useState } from "react";
import { Bell, AlertTriangle, Zap, TrendingUp, CheckCheck } from "lucide-react";
import type { NotificationItem } from "@/lib/notifications";

const TYPE_CONFIG: Record<string, { emoji: string; label: string; color: string; icon: React.ReactNode }> = {
  overtaken: {
    emoji: "⬆",
    label: "Обгон",
    color: "border-orange-500/20 bg-orange-500/[0.08] text-orange-400",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
  danger: {
    emoji: "⚠",
    label: "Внимание",
    color: "border-[#FFB4AB]/20 bg-[#FFB4AB]/[0.08] text-[#FFB4AB]",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  milestone: {
    emoji: "🏆",
    label: "Достижение",
    color: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400",
    icon: <Zap className="w-3.5 h-3.5" />,
  },
};

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

export function NotificationsList({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(
    initialNotifications.filter((n) => !n.is_read).length
  );

  // Poll for new notifications
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unread);
        }
      } catch {
        // silent
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-white/[0.08] p-8 text-center">
        <Bell className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-white/30 text-sm">Пока нет уведомлений</p>
        <p className="text-white/20 text-xs mt-1">Они появятся, когда кто-то обгонит тебя или ты будешь близок к вылету</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mark all read button */}
      {unreadCount > 0 && (
        <button
          onClick={markAllRead}
          className="touch-card w-full mb-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[12px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Отметить все как прочитанные ({unreadCount})
        </button>
      )}

      <div className="space-y-2">
        {notifications.map((n) => {
          const cfg = TYPE_CONFIG[n.type] ?? {
            emoji: "•",
            label: "Событие",
            color: "border-white/[0.06] bg-white/[0.02] text-white/40",
            icon: <Bell className="w-3.5 h-3.5" />,
          };

          return (
            <div
              key={n.id}
              className={`rounded-[18px] border p-3.5 transition-all ${
                !n.is_read
                  ? "border-white/[0.1] bg-white/[0.03]"
                  : "border-white/[0.04] bg-white/[0.01] opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${cfg.color}`}
                >
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-medium">
                      {cfg.label}
                    </span>
                    {!n.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[14px] text-white/80 leading-snug">{n.message}</p>
                  <p className="mt-1 text-[11px] text-white/30">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
