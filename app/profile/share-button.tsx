"use client";

import { Share } from "@capacitor/share";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
  userName: string;
}

export function ShareButton({ userName }: ShareButtonProps) {
  const handleShare = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });

      await Share.share({
        title: `Профиль ${userName} в Discipline`,
        text: `Посмотри мои тренировки и челленджи в приложении Discipline!`,
        url: window.location.href,
        dialogTitle: "Поделиться профилем",
      });
    } catch (e) {
      console.error("Error sharing", e);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex-1 bg-[#1E1F22] text-[#E3E3E3] py-2 px-4 rounded-xl text-sm font-medium hover:bg-[#2A2D33] transition flex items-center justify-center gap-2 active:scale-95"
    >
      <Share2 className="w-4 h-4" />
      Поделиться
    </button>
  );
}