import Link from "next/link";
import { Send, Heart, Zap } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getUnreadMessagesCount } from "@/lib/messages";
import { getUnreadNotificationsCount } from "@/lib/notifications";

export async function TopHeader() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const [unreadMessages, unreadNotifications] = await Promise.all([
    getUnreadMessagesCount(userId),
    getUnreadNotificationsCount(userId),
  ]);

  return (
    // Шапка использует тот же принцип, но блик идет по нижней грани
    <header className="sticky top-0 z-50 bg-[#1C1C1E]/70 backdrop-blur-2xl border-b border-border-thin shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.05)] px-5 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5 active-scale group">
        {/* Логотип: Apple Fitness Green с мягким неоновым свечением */}
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-[0_0_12px_-2px_rgba(50,215,75,0.5)] transition-transform duration-300 group-hover:scale-105">
          <Zap className="w-4 h-4 text-text-on-accent" fill="currentColor" />
        </div>
        <span className="font-bold text-xl tracking-tight text-text-primary group-hover:opacity-80 transition-opacity">
          Discipline
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-bg-hover transition-colors active-scale"
        >
          <Heart className="w-6 h-6 text-text-primary" />
          {/* iOS-стиль системных бейджей */}
          {unreadNotifications > 0 && (
            <div className="absolute top-0 right-0 bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-[#1C1C1E]">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </div>
          )}
        </Link>

        <Link
          href="/messages"
          className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-bg-hover transition-colors active-scale"
        >
          <Send className="w-6 h-6 text-text-primary" />
          {unreadMessages > 0 && (
            <div className="absolute top-0 right-0 bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-[#1C1C1E]">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}