import { ACHIEVEMENTS, type AchievementCategory } from "@/lib/achievements";

// Цветовые категории полностью удалены, оставляем только текстовые лейблы
const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  strength: "Сила",
  discipline: "Дисциплина",
  social: "Общение",
  challenge: "Челленджи",
};

function AchievementBadge({
  achievement,
  unlocked,
}: {
  achievement: typeof ACHIEVEMENTS[number];
  unlocked: boolean;
}) {
  const sizeClass = achievement.rare ? "w-[68px] h-[68px]" : "w-[58px] h-[58px]";
  const emojiSize = achievement.rare ? "text-3xl" : "text-2xl";

  return (
    <div className="flex flex-col items-center gap-1.5 group">
      <div className="relative">
        <div
          className={`${sizeClass} rounded-full flex items-center justify-center transition-all border ${
            unlocked
              ? "bg-bg-nested border-accent text-text-primary"
              : "bg-bg-muted border-border-thin opacity-40 grayscale"
          }`}
        >
          <span className={emojiSize}>
            {achievement.emoji}
          </span>
          {!unlocked && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center">
              <span className="text-base text-text-primary">🔒</span>
            </div>
          )}
        </div>
        
        {/* Бейдж RARE: теперь использует единственный акцентный цвет с контрастным черным текстом */}
        {achievement.rare && unlocked && (
          <div className="absolute -top-1 -right-1 bg-accent text-text-on-accent text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-full border border-bg-card">
            Rare
          </div>
        )}
      </div>
      
      <div className={`text-[9px] text-center leading-tight max-w-[70px] ${
        unlocked ? "text-text-secondary" : "text-text-muted"
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

  // Вычисляем длину окружности для SVG (2 * PI * r), где r = 24
  const circumference = 2 * Math.PI * 24;
  const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;

  return (
    <div className="card-base p-5">
      <div className="flex items-start justify-between mb-8">
        <div>
          {/* Мелкие uppercase подписи */}
          <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
            Достижения
          </div>
          {/* Крупные и жирные цифры */}
          <div className="text-4xl font-bold tracking-[-0.5px] text-text-primary">
            {unlockedCount}
            <span className="text-text-muted text-lg font-normal ml-1">/ {total}</span>
          </div>
        </div>
        
        {/* Кольцевой график: градиенты убраны, обводка сделана тоньше */}
        <div className="relative w-14 h-14 shrink-0">
          <svg className="w-14 h-14 -rotate-90">
            <circle
              cx="28" cy="28" r="24"
              className="stroke-bg-nested"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="28" cy="28" r="24"
              className="stroke-accent transition-all duration-1000 ease-out"
              strokeWidth="2"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text-primary">
            {percent}%
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {categories.map(cat => {
          const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
          const catUnlocked = catAchievements.filter(a => unlockedCodes.has(a.code)).length;
          
          if (catAchievements.length === 0) return null;

          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-3 px-1 border-b border-border-thin pb-2">
                <div className="text-[10px] uppercase tracking-widest text-text-secondary">
                  {CATEGORY_LABELS[cat]}
                </div>
                <div className="text-[10px] text-text-muted font-mono">
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
    </div>
  );
}