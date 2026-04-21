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
    <header className="sticky top-0 z-20 bg-[#10121A]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B4A5FF] to-[#8E7AE0] flex items-center justify-center shadow-[0_0_16px_-4px_rgba(180,165,255,0.6)]">
          <Zap className="w-4 h-4 text-[#322654]" fill="currentColor" />
        </div>
        <span className="font-semibold text-base tracking-tight">Discipline</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/notifications"
          className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition"
        >
          <Heart className="w-[22px] h-[22px] text-[#C8C6D4]" />
          {unreadNotifications > 0 && (
            <div className="absolute top-1 right-1 bg-gradient-to-br from-[#FFB4D4] to-[#E074A8] text-[#4A1B33] text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </div>
          )}
        </Link>

        <Link
          href="/messages"
          className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition"
        >
          <Send className="w-[22px] h-[22px] text-[#C8C6D4]" />
          {unreadMessages > 0 && (
            <div className="absolute top-1 right-1 bg-gradient-to-br from-[#B4A5FF] to-[#8E7AE0] text-[#322654] text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}