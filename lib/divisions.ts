// ─── Division system ─────────────────────────────────────────────────────────
// Divisions represent player identity and progression.
// Each division has unique visual identity, thresholds, and culture.

export interface Division {
  id: string;
  label: string;
  labelEn: string;
  minDays: number;       // minimum survived days to reach
  color: string;         // primary text color
  border: string;        // border color
  bg: string;            // background
  glow: string;          // glow effect
  icon: string;          // emoji
  culture: string;       // one-line description of what this division means
  description: string;   // what it means to be here
}

export const DIVISIONS: Division[] = [
  {
    id: "bronze",
    label: "БРОНЗА",
    labelEn: "BRONZE",
    minDays: 0,
    color: "text-[#CD7F32]",
    border: "border-[#CD7F32]/30",
    bg: "bg-[#CD7F32]/[0.08]",
    glow: "bg-[#CD7F32]/5",
    icon: "🛡️",
    culture: "Новички",
    description: "Ты только вошёл в игру. Каждый день — открытие.",
  },
  {
    id: "silver",
    label: "СЕРЕБРО",
    labelEn: "SILVER",
    minDays: 7,
    color: "text-[#C0C0C0]",
    border: "border-[#C0C0C0]/30",
    bg: "bg-[#C0C0C0]/[0.08]",
    glow: "bg-[#C0C0C0]/5",
    icon: "⚔️",
    culture: "Выжившие",
    description: "Ты пережил первую неделю. Теперь ты знаешь цену дисциплине.",
  },
  {
    id: "gold",
    label: "ЗОЛОТО",
    labelEn: "GOLD",
    minDays: 14,
    color: "text-[#FFD700]",
    border: "border-[#FFD700]/30",
    bg: "bg-[#FFD700]/[0.08]",
    glow: "bg-[#FFD700]/5",
    icon: "🔥",
    culture: "Опасные",
    description: "Две недели выживания. Ты уже опасен для других.",
  },
  {
    id: "elite",
    label: "ЭЛИТА",
    labelEn: "ELITE",
    minDays: 21,
    color: "text-[#A855F7]",
    border: "border-[#A855F7]/30",
    bg: "bg-[#A855F7]/[0.08]",
    glow: "bg-[#A855F7]/5",
    icon: "💎",
    culture: "Почти легенды",
    description: "Три недели без пропусков. Ты — элита этого сезона.",
  },
  {
    id: "legend",
    label: "ЛЕГЕНДА",
    labelEn: "LEGEND",
    minDays: 28,
    color: "text-[#FF6B35]",
    border: "border-[#FF6B35]/30",
    bg: "bg-[#FF6B35]/[0.08]",
    glow: "bg-[#FF6B35]/5",
    icon: "👑",
    culture: "Редкие люди",
    description: "28 дней. Ты — легенда. Тебя помнят даже те, кто вылетел.",
  },
];

export function getDivision(days: number): Division {
  // Find the highest division the player qualifies for
  let result = DIVISIONS[0];
  for (const d of DIVISIONS) {
    if (days >= d.minDays) result = d;
  }
  return result;
}

export function getNextDivision(days: number): Division | null {
  for (const d of DIVISIONS) {
    if (days < d.minDays) return d;
  }
  return null;
}

export function getDivisionProgress(days: number): { current: Division; next: Division | null; progress: number } {
  const current = getDivision(days);
  const next = getNextDivision(days);
  if (!next) return { current, next: null, progress: 100 };

  const range = next.minDays - current.minDays;
  const progress = Math.min(((days - current.minDays) / range) * 100, 100);
  return { current, next, progress };
}
