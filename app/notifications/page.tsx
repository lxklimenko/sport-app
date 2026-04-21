import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Heart, MessageCircle, UserPlus, AtSign } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getMyNotifications, markAllAsRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function formatTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн`;
  const weeks = Math.floor(days / 7);
  return `${weeks} нед`;
}

function getIcon(type: string) {
  switch (type) {
    case "like": return <Heart className="w-4 h-4 text-[#FFB4AB]" fill="currentColor" />;
    case "comment": return <MessageCircle className="w-4 h-4 text-[#A8C7FA]" />;
    case "follow": return <UserPlus className="w-4 h-4 text-[#C4EEDB]" />;
    case "mention": return <AtSign className="w-4 h-4 text-[#FDE293]" />;
    default: return <Bell className="w-4 h-4 text-[#9AA0A6]" />;
  }
}

function getText(type: string, textPreview: string | null) {
  switch (type) {
    case "like": return "оценил твой пост 🔥";
    case "comment": return `написал: "${textPreview ?? ""}"`;
    case "follow": return "подписался на тебя";
    case "mention": return `упомянул тебя: "${textPreview ?? ""}"`;
    default: return "новое уведомление";
  }
}

function getHref(notification: { type: string; postId: string | null; actorId: string }) {
  if (notification.type === "follow") return `/user/${notification.actorId}`;
  if (notification.postId) return `/post/${notification.postId}`;
  return `/user/${notification.actorId}`;
}

export default async function NotificationsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const notifications = await getMyNotifications(userId);
  await markAllAsRead(userId);

  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-20">

      <div className="sticky top-0 z-10 bg-[#0D0F12]/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <h1 className="font-semibold text-lg">Уведомления</h1>
      </div>

      <div className="mx-auto max-w-2xl">

        {notifications.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 rounded-full bg-[#1E1F22] flex items-center justify-center mx-auto mb-5">
              <Bell className="w-9 h-9 text-[#9AA0A6]" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Пока тихо</h2>
            <p className="text-[#9AA0A6] text-sm">
              Как только кто-то лайкнет твой пост или подпишется — ты узнаешь
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map(n => {
              const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(n.actorName)}`;
              const isUnread = !n.readAt;
              return (
                <Link
                  key={n.id}
                  href={getHref(n)}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition ${
                    isUnread ? "bg-[#A8C7FA]/5" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={avatarUrl}
                      alt={n.actorName}
                      className="w-12 h-12 rounded-full bg-[#1E1F22]"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1E1F22] flex items-center justify-center">
                      {getIcon(n.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold">{n.actorName}</span>{" "}
                      <span className="text-[#C4C7C5]">{getText(n.type, n.textPreview)}</span>
                    </div>
                    <div className="text-xs text-[#9AA0A6] mt-0.5">
                      {formatTime(n.createdAt)}
                    </div>
                  </div>
                  {isUnread && (
                    <div className="w-2 h-2 rounded-full bg-[#A8C7FA] shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}