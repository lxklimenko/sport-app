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
    <header className="sticky top-0 z-20 bg-[#0D0F12]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#A8C7FA] flex items-center justify-center">
          <Zap className="w-4 h-4 text-[#062E6F]" fill="currentColor" />
        </div>
        <span className="font-semibold text-base">Discipline</span>
      </Link>

      <div className="flex items-center gap-5">
        <Link
          href="/notifications"
          className="relative text-[#E3E3E3] hover:text-white transition"
        >
          <Heart className="w-6 h-6" />
          {unreadNotifications > 0 && (
            <div className="absolute -top-1 -right-1 bg-[#FFB4AB] text-[#4A1B0C] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </div>
          )}
        </Link>

        <Link
          href="/messages"
          className="relative text-[#E3E3E3] hover:text-white transition"
        >
          <Send className="w-6 h-6" />
          {unreadMessages > 0 && (
            <div className="absolute -top-1 -right-1 bg-[#A8C7FA] text-[#062E6F] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}