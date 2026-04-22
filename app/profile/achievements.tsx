import { ACHIEVEMENTS, type AchievementCategory } from "@/lib/achievements";

// Оставляем только строгие текстовые лейблы
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
    <div className="flex flex-col items-center gap-2 group">
      <div className="relative">
        <div
          className={`${sizeClass} rounded-full flex items-center justify-center transition-all duration-300 ${
            unlocked
              ? "bg-bg-nested border border-border-thin shadow-[0_4px_12px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] group-hover:scale-105 group-hover:bg-bg-hover" // Эффект выпуклой стеклянной кнопки
              : "bg-bg-muted/50 border border-transparent shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] opacity-50 grayscale" // Эффект вдавленности для заблокированных
          }`}
        >
          <span className={emojiSize}>
            {achievement.emoji}
          </span>
          {!unlocked && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center">
              <span className="text-base opacity-40">🔒</span>
            </div>
          )}
        </div>
        
        {/* Бейдж RARE: Apple Fitness Green с черным текстом и строгой обводкой */}
        {achievement.rare && unlocked && (
          <div className="absolute -top-1 -right-1 bg-accent text-text-on-accent text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full border-[2px] border-bg-nested shadow-sm transition-transform duration-300 group-hover:scale-110">
            Rare
          </div>
        )}
      </div>
      
      <div className={`text-[10px] text-center leading-tight max-w-[70px] font-medium transition-colors ${
        unlocked ? "text-text-secondary group-hover:text-text-primary" : "text-text-muted/70"
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
          {/* Мелкие uppercase подписи в стиле iOS */}
          <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1 font-medium">
            Достижения
          </div>
          {/* Крупные и жирные цифры */}
          <div className="text-4xl font-bold tracking-[-0.5px] text-text-primary drop-shadow-sm">
            {unlockedCount}
            <span className="text-text-muted text-xl font-medium ml-1">/ {total}</span>
          </div>
        </div>
        
        {/* Кольцевой график: в стиле Activity Rings от Apple */}
        <div className="relative w-14 h-14 shrink-0">
          <svg className="w-14 h-14 -rotate-90 filter drop-shadow-sm">
            {/* Фоновое кольцо (чуть темнее для контраста) */}
            <circle
              cx="28" cy="28" r="24"
              className="stroke-bg-muted"
              strokeWidth="4.5"
              fill="none"
            />
            {/* Кольцо прогресса (Зеленое) */}
            <circle
              cx="28" cy="28" r="24"
              className="stroke-accent transition-all duration-1000 ease-out"
              strokeWidth="4.5"
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
              <div className="flex items-center justify-between mb-4 px-1 border-b border-border-thin pb-2 shadow-[0_1px_0_0_rgba(0,0,0,0.2)]">
                <div className="text-[11px] uppercase tracking-widest text-text-secondary font-medium">
                  {CATEGORY_LABELS[cat]}
                </div>
                <div className="text-[11px] text-text-muted font-mono font-medium">
                  {catUnlocked}/{catAchievements.length}
                </div>
              </div>
              <div className="flex gap-4 flex-wrap pt-1">
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