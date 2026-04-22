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
    <header className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-xl border-b border-border-thin px-5 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5 active-scale group">
        {/* Логотип: строгий круг с нашим Fitness Green акцентом, без свечений */}
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
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
          {/* Иконки делаем контрастными */}
          <Heart className="w-6 h-6 text-text-primary" />
          {/* Бейджи в стиле iOS: красный системный цвет с обводкой под цвет фона */}
          {unreadNotifications > 0 && (
            <div className="absolute top-0 right-0 bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-bg-main">
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
            <div className="absolute top-0 right-0 bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-bg-main">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}