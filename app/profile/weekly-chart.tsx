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
          <div className="text-4xl font-bold tracking-[-0.5px] text-text-primary drop-shadow-sm">
            {avgPerWeek.toLocaleString("ru-RU")}
            <span className="text-text-muted text-xl font-medium ml-2">/ нед</span>
          </div>
        </div>
        
        {/* Тренд: Физическая кнопка (выпуклая при росте, вдавленная при спаде) */}
        {trend !== 0 && totalLast12Weeks > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
            trend > 0 
              ? "bg-[#0A2E11] border border-accent/30 text-accent shadow-[0_2px_8px_-2px_rgba(50,215,75,0.2),inset_0_1px_0_0_rgba(255,255,255,0.15)]" 
              : "bg-bg-muted/50 border border-transparent text-text-muted shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
          }`}>
            <span className={trend > 0 ? "drop-shadow-sm" : ""}>{trend > 0 ? "↗" : "↘"}</span>
            <span className={trend > 0 ? "drop-shadow-sm" : ""}>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      {/* Контейнер графика с лёгким эффектом глубины по нижней линии */}
      <div className="flex items-end gap-2 h-32 mb-4 relative before:absolute before:bottom-0 before:inset-x-0 before:h-px before:bg-border-thin before:shadow-[0_1px_0_0_rgba(255,255,255,0.02)]">
        {weeks.map((week, i) => {
          const heightPercent = maxValue > 0 ? (week.total / maxValue) * 100 : 0;
          const isCurrent = i === currentWeekIndex;
          const hasData = week.total > 0;
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group h-full z-10">
              <div
                className={`w-full rounded-t-[4px] transition-all duration-300 origin-bottom ${
                  isCurrent
                    ? "bg-accent shadow-[0_0_16px_-4px_rgba(50,215,75,0.5),inset_0_2px_0_0_rgba(255,255,255,0.5)] z-20" // Текущая неделя: светящаяся стеклянная колба
                    : hasData
                    ? "bg-bg-nested border border-border-thin border-b-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] group-hover:bg-bg-hover group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.1)] group-hover:-translate-y-0.5" // Прошлые недели: объёмные матовые столбцы
                    : "bg-transparent border-b border-transparent" // Пустые недели
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
        <span className="text-accent font-bold drop-shadow-[0_0_4px_rgba(50,215,75,0.3)]">Эта неделя</span>
      </div>
    </div>
  );
}