import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getMyDialogs } from "@/lib/messages";

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

export default async function MessagesPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const dialogs = await getMyDialogs(userId);

  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-20">

      <div className="sticky top-0 z-10 bg-[#0D0F12]/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <h1 className="font-semibold text-lg">Сообщения</h1>
      </div>

      <div className="mx-auto max-w-2xl">

        {dialogs.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 rounded-full bg-[#1E1F22] flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="w-9 h-9 text-[#9AA0A6]" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Пока нет сообщений</h2>
            <p className="text-[#9AA0A6] text-sm mb-6">
              Зайди на страницу любого участника и нажми "Сообщение" чтобы начать диалог
            </p>
            <Link
              href="/users"
              className="inline-flex items-center gap-2 rounded-full bg-[#A8C7FA] px-6 py-3 font-semibold text-[#062E6F] hover:bg-[#BBD6FE] transition text-sm"
            >
              Найти участников
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {dialogs.map(dialog => {
              const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(dialog.otherUserName)}`;
              const isMyLastMessage = dialog.lastSenderId === userId;
              return (
                <Link
                  key={dialog.otherUserId}
                  href={`/chat/${dialog.otherUserId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition"
                >
                  <img
                    src={avatarUrl}
                    alt={dialog.otherUserName}
                    className="w-12 h-12 rounded-full bg-[#1E1F22] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <div className={`font-semibold text-sm truncate ${
                        dialog.unreadCount > 0 ? "text-white" : ""
                      }`}>
                        {dialog.otherUserName}
                      </div>
                      <div className="text-xs text-[#9AA0A6] shrink-0">
                        {formatTime(dialog.lastMessageAt)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2 mt-0.5">
                      <div className={`text-sm truncate ${
                        dialog.unreadCount > 0 && !isMyLastMessage
                          ? "text-[#E3E3E3] font-medium"
                          : "text-[#9AA0A6]"
                      }`}>
                        {isMyLastMessage && "Ты: "}
                        {dialog.lastMessage}
                      </div>
                      {dialog.unreadCount > 0 && (
                        <div className="shrink-0 bg-[#A8C7FA] text-[#062E6F] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5">
                          {dialog.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
