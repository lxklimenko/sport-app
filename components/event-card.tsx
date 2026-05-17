"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Users, Skull } from "lucide-react";

interface EventCardProps {
  id: string;
  title: string;
  slug?: string;
  emoji: string | null;
  discipline: string;
  starts_at: string;
  ends_at: string;
  joined: boolean;
  participant_count?: number;
  alive_count?: number;
  eliminated_count?: number;
}

export function EventCard({
  id,
  title,
  slug,
  emoji,
  discipline,
  starts_at,
  ends_at,
  joined,
  participant_count = 0,
  alive_count = 0,
  eliminated_count = 0,
}: EventCardProps) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(joined);
  const [toast, setToast] = useState<string | null>(null);

  const now = new Date();
  const start = new Date(starts_at);
  const end = new Date(ends_at);
  const isLive = start <= now && end > now;
  const isUpcoming = start > now;
  const endsIn = Math.round((end.getTime() - now.getTime()) / 3600000);
  const startsIn = Math.round((start.getTime() - now.getTime()) / 3600000);
  const eventSlug = slug ?? id;

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

      <Link
        href={`/events/${eventSlug}`}
        className="block px-4 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors active:scale-[0.995]"
      >
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Emoji */}
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-[20px] shrink-0">
            {emoji ?? "📅"}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] text-white/85 font-semibold leading-tight">{title}</p>

            {/* Tension subtitle */}
            {isLive && (
              <p className="text-[11px] text-white/35 mt-1">
                {participant_count > 0
                  ? `${participant_count} ${participant_count === 1 ? "человек" : "человек"} внутри`
                  : "Присоединяйся первым"}
                {eliminated_count > 0 && ` · ${eliminated_count} выбыли`}
              </p>
            )}
            {isUpcoming && (
              <p className="text-[11px] text-white/35 mt-1">
                Старт через {startsIn} ч
              </p>
            )}
          </div>

          {/* CTA */}
          {!isJoined ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className={[
                "shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.08em] transition-all",
                "active:scale-[0.95] disabled:opacity-50",
                isLive
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                  : "bg-white/[0.08] text-white/70 border border-white/[0.08] hover:bg-white/[0.12]",
              ].join(" ")}
            >
              {joining ? "..." : isLive ? "LIVE" : "Войти"}
            </button>
          ) : (
            <div className="shrink-0 text-right">
              <span className="text-[11px] text-emerald-400/70 font-semibold">Участвуешь</span>
              {isLive && (
                <p className="text-[10px] text-white/25 mt-0.5">
                  осталось {endsIn} ч
                </p>
              )}
            </div>
          )}
        </div>

        {/* Stats row for joined users */}
        {isJoined && isLive && participant_count > 0 && (
          <div className="mt-2.5 flex items-center gap-3 text-[10px] text-white/25">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{alive_count} в игре</span>
            </div>
            {eliminated_count > 0 && (
              <div className="flex items-center gap-1">
                <Skull className="w-3 h-3" />
                <span>{eliminated_count} выбыли</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>ещё {endsIn} ч</span>
            </div>
          </div>
        )}
      </Link>
    </>
  );
}
