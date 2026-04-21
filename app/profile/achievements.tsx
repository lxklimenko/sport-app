import { ACHIEVEMENTS, type AchievementCategory } from "@/lib/achievements";

const CATEGORY_STYLES: Record<AchievementCategory, {
  bg: string;
  bgUnlocked: string;
  text: string;
  label: string;
  glow: string;
}> = {
  strength: {
    bg: "bg-gradient-to-br from-[#B4A5FF] to-[#8E7AE0]",
    bgUnlocked: "from-[#B4A5FF] to-[#8E7AE0]",
    text: "text-[#322654]",
    label: "Сила",
    glow: "shadow-[0_0_20px_-4px_rgba(180,165,255,0.5)]",
  },
  discipline: {
    bg: "bg-gradient-to-br from-[#FFD8A8] to-[#E8A960]",
    bgUnlocked: "from-[#FFD8A8] to-[#E8A960]",
    text: "text-[#4A3521]",
    label: "Дисциплина",
    glow: "shadow-[0_0_20px_-4px_rgba(255,216,168,0.5)]",
  },
  social: {
    bg: "bg-gradient-to-br from-[#FFB4D4] to-[#E074A8]",
    bgUnlocked: "from-[#FFB4D4] to-[#E074A8]",
    text: "text-[#4A1B33]",
    label: "Общение",
    glow: "shadow-[0_0_20px_-4px_rgba(255,180,212,0.5)]",
  },
  challenge: {
    bg: "bg-gradient-to-br from-[#B4F5D8] to-[#6ED4A8]",
    bgUnlocked: "from-[#B4F5D8] to-[#6ED4A8]",
    text: "text-[#0F3D2C]",
    label: "Челленджи",
    glow: "shadow-[0_0_20px_-4px_rgba(180,245,216,0.5)]",
  },
};

function AchievementBadge({
  achievement,
  unlocked,
}: {
  achievement: typeof ACHIEVEMENTS[number];
  unlocked: boolean;
}) {
  const style = CATEGORY_STYLES[achievement.category];
  const sizeClass = achievement.rare ? "w-[68px] h-[68px]" : "w-[58px] h-[58px]";
  const emojiSize = achievement.rare ? "text-3xl" : "text-2xl";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <div
          className={`${sizeClass} rounded-full flex items-center justify-center transition-all ${
            unlocked
              ? `bg-gradient-to-br ${style.bgUnlocked} ${style.glow}`
              : "bg-[#2B2839]"
          }`}
        >
          <span className={`${emojiSize} ${unlocked ? "" : "grayscale opacity-40"}`}>
            {achievement.emoji}
          </span>
          {!unlocked && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center">
              <span className="text-base opacity-60">🔒</span>
            </div>
          )}
        </div>
        {achievement.rare && unlocked && (
          <div className="absolute -top-1 -right-1 bg-[#FFD8A8] text-[#4A3521] text-[8px] font-bold px-1.5 py-0.5 rounded-full">
            RARE
          </div>
        )}
      </div>
      <div className={`text-[9px] text-center leading-tight max-w-[70px] ${
        unlocked ? "text-[#C8C6D4]" : "text-[#8F8D9C]"
      }`}>
        {achievement.title}
      </div>
    </div>
  );
}

export function AchievementsBadges({
  unlocked,
}: {
  unlocked: { code: string; unlockedAt: string }[];
}) {
  const unlockedCodes = new Set(unlocked.map(u => u.code));
  const total = ACHIEVEMENTS.length;
  const unlockedCount = unlockedCodes.size;
  const percent = Math.round((unlockedCount / total) * 100);

  const categories: AchievementCategory[] = ["strength", "discipline", "social", "challenge"];

  return (
    <div className="bg-[#1D1B26] rounded-[1.75rem] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#8F8D9C] mb-1">
            Достижения
          </div>
          <div className="text-lg font-semibold">
            {unlockedCount} <span className="text-[#8F8D9C] text-sm font-normal">из {total}</span>
          </div>
        </div>
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90">
            <circle
              cx="28" cy="28" r="24"
              stroke="#2B2839"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="28" cy="28" r="24"
              stroke="url(#achieveGrad)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${(percent / 100) * 150.8} 150.8`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="achieveGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#B4A5FF" />
                <stop offset="100%" stopColor="#FFD8A8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
            {percent}%
          </div>
        </div>
      </div>

      {categories.map(cat => {
        const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
        const catUnlocked = catAchievements.filter(a => unlockedCodes.has(a.code)).length;
        const style = CATEGORY_STYLES[cat];
        return (
          <div key={cat} className="mb-4 last:mb-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-[11px] font-semibold text-[#C8C6D4]">
                {style.label}
              </div>
              <div className="text-[10px] text-[#8F8D9C]">
                {catUnlocked}/{catAchievements.length}
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {catAchievements.map(a => (
                <AchievementBadge
                  key={a.code}
                  achievement={a}
                  unlocked={unlockedCodes.has(a.code)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}