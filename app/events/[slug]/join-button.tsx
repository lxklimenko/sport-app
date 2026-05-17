"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { EventEntryOverlay } from "@/components/event-entry-overlay";

interface Theme {
  bg: string;
  glow: string;
  accent: string;
  accentText: string;
  border: string;
  dot: string;
  live: string;
}

export function JoinButton({ eventId, title, emoji, participantCount, theme }: {
  eventId: string;
  title: string;
  emoji?: string | null;
  participantCount?: number;
  theme?: Theme;
}) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [showEntry, setShowEntry] = useState(false);

  const handleJoin = async () => {
    if (joining) return;
    setJoining(true);
    try {
      const res = await fetch("/api/events/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) {
        setShowEntry(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setJoining(false);
    }
  };

  const btnClass = theme
    ? `${theme.accent} ${theme.accentText} border ${theme.border}`
    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";

  return (
    <>
      {showEntry && theme && (
        <EventEntryOverlay
          title={title}
          emoji={emoji ?? null}
          participantCount={participantCount ?? 0}
          theme={theme}
          onDone={() => {
            setShowEntry(false);
            router.refresh();
          }}
        />
      )}

      <button
        onClick={handleJoin}
        disabled={joining}
        className={`w-full h-14 rounded-[20px] text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all disabled:opacity-50 mb-5 ${btnClass}`}
      >
        <Zap className="w-4 h-4" />
        {joining ? "..." : "ВОЙТИ В СОБЫТИЕ"}
      </button>
    </>
  );
}
