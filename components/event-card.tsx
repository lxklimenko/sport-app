"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EventCardProps {
  id: string;
  title: string;
  emoji: string | null;
  discipline: string;
  starts_at: string;
  ends_at: string;
  joined: boolean;
}

export function EventCard({ id, title, emoji, discipline, starts_at, ends_at, joined }: EventCardProps) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(joined);
  const [toast, setToast] = useState<string | null>(null);

  const isLive = new Date(starts_at) <= new Date() && new Date(ends_at) > new Date();
  const startsIn = Math.round((new Date(starts_at).getTime() - Date.now()) / 3600000);
  const timeLabel = isLive ? "Идёт сейчас" : startsIn > 0 ? `Старт через ${startsIn} ч` : "Скоро";

  const handleJoin = async () => {
    if (isJoined || joining) return;
    setJoining(true);
    try {
      const res = await fetch("/api/events/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id }),
      });
      if (res.ok) {
        setIsJoined(true);
        setToast(`Ты вошёл в ${title}`);
        setTimeout(() => setToast(null), 3000);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-white/[0.08] border border-white/[0.12] backdrop-blur-xl text-[13px] text-white font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
        <span className="text-sm">{emoji ?? "📅"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-white/70 font-medium truncate">{title}</p>
          <p className="text-[11px] text-white/30">{timeLabel}{isJoined ? " · ✅ Ты участвуешь" : ""}</p>
        </div>
        {!isJoined ? (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white/[0.08] text-[11px] text-white/70 font-semibold active:scale-[0.95] transition-all hover:bg-white/[0.12] disabled:opacity-50"
          >
            {joining ? "..." : "Войти"}
          </button>
        ) : (
          <span className="shrink-0 text-[11px] text-emerald-400/70 font-medium">Участвуешь</span>
        )}
      </div>
    </>
  );
}
