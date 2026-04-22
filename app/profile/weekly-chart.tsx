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
    <div className="card-base p-5">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1 font-medium">
            Прогресс за 12 недель
          </div>
          <div className="text-4xl font-bold tracking-[-0.5px] text-text-primary">
            {avgPerWeek.toLocaleString("ru-RU")}
            <span className="text-text-muted text-xl font-medium ml-2">/ нед</span>
          </div>
        </div>
        
        {/* Тренд: Акцент для роста, глухой для спада. Рамки в стиле iOS */}
        {trend !== 0 && totalLast12Weeks > 0 && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
            trend > 0 ? "bg-bg-nested border-border-thin text-accent" : "bg-bg-main border-transparent text-text-muted"
          }`}>
            <span>{trend > 0 ? "↗" : "↘"}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 h-32 mb-4">
        {weeks.map((week, i) => {
          const heightPercent = maxValue > 0 ? (week.total / maxValue) * 100 : 0;
          const isCurrent = i === currentWeekIndex;
          const hasData = week.total > 0;
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group h-full">
              <div
                className={`w-full rounded-t-[4px] transition-all duration-300 ${
                  isCurrent
                    ? "bg-accent" // Текущая неделя горит Apple Green
                    : hasData
                    ? "bg-bg-nested border border-border-thin border-b-0 group-hover:bg-bg-hover" // Прошлые недели: строгие блоки
                    : "bg-transparent border-b border-border-thin" // Пустые недели: просто линия на дне
                }`}
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
                title={`${week.label}: ${week.total.toLocaleString("ru-RU")}`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] uppercase tracking-widest px-1 font-medium">
        <span className="text-text-muted">{weeks[0]?.label}</span>
        <span className="text-text-muted">{weeks[Math.floor(weeks.length / 2)]?.label}</span>
        <span className="text-accent font-bold">Эта неделя</span>
      </div>
    </div>
  );
}