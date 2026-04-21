export function WeeklyChart({ 
  weeks 
}: { 
  weeks: { label: string; total: number; startDate: string }[] 
}) {
  const maxValue = Math.max(...weeks.map(w => w.total), 1);
  const totalLast12Weeks = weeks.reduce((sum, w) => sum + w.total, 0);
  const avgPerWeek = Math.round(totalLast12Weeks / 12);

  const currentWeekIndex = weeks.length - 1;

  const previousHalfAvg = weeks.slice(0, 6).reduce((s, w) => s + w.total, 0) / 6;
  const currentHalfAvg = weeks.slice(6).reduce((s, w) => s + w.total, 0) / 6;
  const trend = previousHalfAvg > 0
    ? Math.round(((currentHalfAvg - previousHalfAvg) / previousHalfAvg) * 100)
    : 0;

  return (
    <div className="bg-[#1E1F22] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold">Прогресс за 12 недель</div>
          <div className="text-xs text-[#9AA0A6] mt-0.5">
            В среднем: {avgPerWeek.toLocaleString("ru-RU")} /нед
          </div>
        </div>
        {trend !== 0 && totalLast12Weeks > 0 && (
          <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
            trend > 0 
              ? "bg-[#1E3A2E] text-[#7FDBAA]" 
              : "bg-[#3A1E1E] text-[#FFB4AB]"
          }`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="flex items-end gap-1.5 h-32 mb-2">
        {weeks.map((week, i) => {
          const heightPercent = maxValue > 0 ? (week.total / maxValue) * 100 : 0;
          const isCurrent = i === currentWeekIndex;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group">
              <div
                className={`w-full rounded-t-md transition-all ${
                  isCurrent
                    ? "bg-[#A8C7FA]"
                    : week.total > 0
                    ? "bg-[#4BAE7F]"
                    : "bg-[#2A2D33]"
                }`}
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
                title={`${week.label}: ${week.total.toLocaleString("ru-RU")}`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[9px] text-[#9AA0A6] px-0.5">
        <span>{weeks[0]?.label}</span>
        <span>{weeks[Math.floor(weeks.length / 2)]?.label}</span>
        <span className="text-[#A8C7FA] font-semibold">эта неделя</span>
      </div>
    </div>
  );
}