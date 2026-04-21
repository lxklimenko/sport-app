const DAY_LABELS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export function StreakBadge({
  current,
  best,
  weekDays,
}: {
  current: number;
  best: number;
  weekDays: boolean[];
}) {
  if (current === 0 && weekDays.every(d => !d)) {
    return null;
  }

  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  return (
    <div className="bg-[#1E1F22] rounded-2xl p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🔥</span>
        <div className="text-sm font-semibold">
          {current > 0 ? (
            <>
              {current} {current === 1 ? "день" : "дней подряд"}
            </>
          ) : (
            <span className="text-[#9AA0A6]">Серия прервалась</span>
          )}
        </div>
        {best > 0 && (
          <div className="ml-auto text-xs text-[#9AA0A6]">
            рекорд {best}
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {weekDays.map((done, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition ${
              done
                ? "bg-[#FF6B35]"
                : i === todayIndex
                ? "bg-[#2A2D33] border border-[#FF6B35]/50"
                : "bg-[#2A2D33]"
            }`}
          />
        ))}
      </div>

      <div className="flex justify-between mt-1.5 text-[9px] text-[#9AA0A6]">
        {DAY_LABELS.map((label, i) => (
          <span
            key={i}
            className={i === todayIndex ? "text-[#FF6B35] font-semibold" : ""}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}