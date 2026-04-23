"use client";

import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { logout } from "@/app/actions/auth";

interface ProfileHeaderProps {
  userName: string;
}

export function ProfileHeader({ userName }: ProfileHeaderProps) {
  const handlePlusClick = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {}
  };

  return (
    <div className="sticky top-0 z-50 glass-panel px-4 py-2 flex items-center justify-between min-h-[60px]">
      <Link
        href="/new-post"
        onClick={handlePlusClick}
        className="flex items-center justify-center w-11 h-11 text-text-primary hover:text-accent transition-all active:scale-75"
        aria-label="Добавить пост"
      >
        <Plus className="w-7 h-7" />
      </Link>

      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(50,215,75,0.6)]" />
        <span className="font-bold tracking-tight text-sm uppercase tracking-widest text-text-primary">{userName}</span>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="flex items-center justify-center w-11 h-11 text-text-primary hover:text-accent transition-all active:scale-75"
          aria-label="Выход"
        >
          <Settings className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
}