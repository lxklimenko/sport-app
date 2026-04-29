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
    <header className="sticky top-0 z-50 glass-panel px-4 py-1.5 flex items-center justify-between">
      <Link
        href="/new-post"
        onClick={handlePlusClick}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition active:scale-90"
        aria-label="Добавить пост"
      >
        <Plus className="w-4 h-4" />
      </Link>

      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span className="font-medium text-xs tracking-wide text-white/90">{userName}</span>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition active:scale-90"
          aria-label="Выход"
        >
          <Settings className="w-4 h-4" />
        </button>
      </form>
    </header>
  );
}