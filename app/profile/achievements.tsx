import { ACHIEVEMENTS } from "@/lib/achievements";

export function AchievementsBadges({
  unlocked,
}: {
  unlocked: { code: string; unlockedAt: string }[];
}) {
  const unlockedCodes = new Set(unlocked.map(u => u.code));
  const total = ACHIEVEMENTS.length;
  const unlockedCount = unlockedCodes.size;

  return (
    <div className="bg-[#1E1F22] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Достижения</div>
        <div className="text-xs text-[#9AA0A6]">
          {unlockedCount} из {total}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ACHIEVEMENTS.map(a => {
          const isUnlocked = unlockedCodes.has(a.code);
          return (
            <div
              key={a.code}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 transition ${
                isUnlocked
                  ? "bg-[#2A2D33]"
                  : "bg-[#0D0F12] opacity-30"
              }`}
              title={isUnlocked ? `${a.title}: ${a.description}` : `${a.title} (закрыто)`}
            >
              <div className="text-2xl mb-0.5">{a.emoji}</div>
              <div className="text-[8px] text-center text-[#9AA0A6] leading-tight line-clamp-2 px-0.5">
                {a.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}