import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { getDialog, markDialogAsRead } from "@/lib/messages";
import { sendMessageAction } from "@/app/actions";

export const dynamic = "force-dynamic";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const msgDay = new Date(d);
  msgDay.setHours(0, 0, 0, 0);

  if (msgDay.getTime() === today.getTime()) return "Сегодня";
  if (msgDay.getTime() === yesterday.getTime()) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: otherUserId } = await params;
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  if (userId === otherUserId) {
    redirect("/messages");
  }

  const otherUser = await getUserById(otherUserId);
  if (!otherUser) notFound();

  await markDialogAsRead(userId, otherUserId);
  const messages = await getDialog(userId, otherUserId);

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(otherUser.name)}`;

  const groupedMessages: { date: string; messages: typeof messages }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  }

  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-24">

      <div className="sticky top-0 z-10 bg-[#0D0F12]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link
          href="/messages"
          className="p-2 -ml-2 hover:bg-white/5 rounded-full transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link
          href={`/user/${otherUser.id}`}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition"
        >
          <img
            src={avatarUrl}
            alt={otherUser.name}
            className="w-8 h-8 rounded-full bg-[#1E1F22]"
          />
          <div className="min-w-0">
            <div className="font-semibold truncate">{otherUser.name}</div>
            <div className="text-xs text-[#9AA0A6] truncate">
              {otherUser.favoriteFormat}
            </div>
          </div>
        </Link>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-4">

        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">👋</div>
            <p className="text-[#9AA0A6] text-sm">
              Напиши первое сообщение<br />
              <span className="text-xs opacity-70">обсудите тренировки или поддержите друг друга</span>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                <div className="text-center text-xs text-[#9AA0A6] mb-3">
                  {group.date}
                </div>
                <div className="space-y-1">
                  {group.messages.map((msg, mi) => {
                    const isMine = msg.senderId === userId;
                    const prev = group.messages[mi - 1];
                    const sameAuthorAsPrev = prev && prev.senderId === msg.senderId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"} ${
                          sameAuthorAsPrev ? "mt-0.5" : "mt-2"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isMine
                              ? "bg-[#A8C7FA] text-[#062E6F]"
                              : "bg-[#1E1F22] text-[#E3E3E3]"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                          <p className={`text-[10px] mt-1 ${
                            isMine ? "text-[#062E6F]/70" : "text-[#9AA0A6]"
                          } text-right`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-16 inset-x-0 bg-[#0D0F12]/95 backdrop-blur border-t border-white/5 p-3">
        <div className="mx-auto max-w-2xl">
          <form action={sendMessageAction} className="flex gap-2">
            <input type="hidden" name="receiverId" value={otherUser.id} />
            <input
              name="text"
              required
              maxLength={2000}
              autoComplete="off"
              placeholder="Написать сообщение..."
              className="flex-1 bg-[#1E1F22] rounded-full px-5 py-3 text-sm outline-none focus:ring-1 focus:ring-[#A8C7FA] placeholder-[#9AA0A6]"
            />
            <button
              type="submit"
              className="bg-[#A8C7FA] text-[#062E6F] px-5 rounded-full font-semibold text-sm hover:bg-[#BBD6FE] transition"
            >
              Отправить
            </button>
          </form>
        </div>
      </div>

    </main>
  );
}