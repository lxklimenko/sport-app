"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import type { NotificationItem } from "@/lib/notifications";

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<NotificationItem | null>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        // If new notification appeared, show toast
        if (data.unread > unread && unread > 0) {
          const newest = data.notifications[0];
          if (newest && !newest.is_read) {
            setToast(newest);
            setTimeout(() => setToast(null), 5000);
          }
        }
        setUnread(data.unread);
      }
    } catch {
      // silent
    }
  }, [unread]);

  // Poll every 15 seconds
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-slide-up">
          <div className="rounded-[18px] border border-white/[0.1] bg-[#1a1a1c] backdrop-blur-2xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500/[0.1] border border-orange-500/20 flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-[0.12em] text-orange-400/70 font-medium mb-0.5">
                  {toast.type === "overtaken" ? "Тебя обогнали" : toast.type === "danger" ? "Внимание" : "Событие"}
                </p>
                <p className="text-[13px] text-white/80 leading-snug">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-white/20 hover:text-white/50 text-[18px] leading-none shrink-0"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bell icon */}
      <Link
        href="/notifications"
        className="relative w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-[9px] font-bold text-white flex items-center justify-center shadow-[0_0_8px_rgba(249,115,22,0.5)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </>
  );
}
