"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

export function JoinButton({ eventId, title }: { eventId: string; title: string }) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-white/[0.08] border border-white/[0.12] backdrop-blur-xl text-[13px] text-white font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          {toast}
        </div>
      )}

      <button
        onClick={handleJoin}
        disabled={joining}
        className="w-full h-14 rounded-[20px] bg-emerald-500/20 text-emerald-300 text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.985] transition-all border border-emerald-500/30 disabled:opacity-50 mb-5"
      >
        <Zap className="w-4 h-4" />
        {joining ? "..." : "ВОЙТИ В СОБЫТИЕ"}
      </button>
    </>
  );
}
