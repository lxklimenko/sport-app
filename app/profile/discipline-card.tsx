"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function DisciplineCard({
  id, emoji, name, goal,
}: {
  id: string;
  emoji: string;
  name: string;
  goal: string;
}) {
  const router = useRouter();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/season/current?d=${id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/season/current?d=${id}`)}
      className="touch-card flex items-center gap-3 rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-3.5 cursor-pointer active:scale-[0.99] active:bg-white/[0.04] transition-all select-none"
    >
      <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center text-[20px] shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-semibold text-white leading-none">{name}</p>
        <p className="mt-1 text-[12px] text-white/40">{goal}</p>
      </div>
      <Link
        href={`/record?d=${id}`}
        onClick={(e) => e.stopPropagation()}
        className="touch-card h-8 px-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-[12px] text-white/55 shrink-0 active:scale-[0.97] transition-all flex items-center"
      >
        Записать
      </Link>
    </div>
  );
}
