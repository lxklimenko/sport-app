export const DISCIPLINE_CONFIG: Record<string, { emoji: string; name: string; label: string; unit: string }> = {
  steps:   { emoji: "👟", name: "Шаги",  label: "шагов",  unit: "шагов" },
  running: { emoji: "🏃", name: "Бег",   label: "бег",    unit: "км" },
  burpees: { emoji: "💥", name: "Бёрпи", label: "бёрпи",  unit: "повт." },
};

export function getDisciplineLabel(disciplineId: string): string {
  return DISCIPLINE_CONFIG[disciplineId]?.label ?? disciplineId;
}

export function getDisciplineUnit(disciplineId: string): string {
  return DISCIPLINE_CONFIG[disciplineId]?.unit ?? "";
}
