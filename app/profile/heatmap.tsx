const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

// Премиальные стили для ячеек активности
function getIntensityClass(value: number): string {
  if (value === 0) 
    return "bg-bg-main border border-transparent shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] opacity-60"; // Вдавленная пустая лунка
  if (value < 3000) 
    return "bg-[#0A2E11] border border-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"; // Уровень 1 (легкий блик)
  if (value < 7000) 
    return "bg-[#115820] border border-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]"; // Уровень 2
  if (value < 15000) 
    return "bg-[#1B8B33] border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.2)]"; // Уровень 3 (выпуклый)
  
  // Максимальный уровень: яркий Apple Fitness Green со свечением
  return "bg-accent border border-transparent shadow-[0_2px_6px_-2px_rgba(50,215,75,0.6),inset_0_1px_0_0_rgba(255,255,255,0.4)]"; 
}

export function ActivityHeatmap({ data }: { data: Record<string, number> }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();
  const todayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - todayOffset);

  const weeks: { date: Date; key: string; value: number; isFuture: boolean; isToday: boolean }[][] = [];
  const weeksCount = 26;
  const startDate = new Date(lastMonday);
  startDate.setDate(lastMonday.getDate() - (weeksCount - 1) * 7);

  // Функционал дат остался нетронутым
  for (let w = 0; w < weeksCount; w++) {
    const week: { date: Date; key: string; value: number; isFuture: boolean; isToday: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const isFuture = date.getTime() > today.getTime();
      const isToday = date.getTime() === today.getTime();
      week.push({
        date,
        key,
        value: data[key] ?? 0,
        isFuture,
        isToday,
      });
    }
    weeks.push(week);
  }

  const monthLabels: { weekIndex: number; month: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const firstDay = week[0].date;
    if (firstDay.getMonth() !== lastMonth) {
      monthLabels.push({ weekIndex: i, month: MONTHS[firstDay.getMonth()] });
      lastMonth = firstDay.getMonth();
    }
  });

  const allValues = Object.values(data).filter(v => v > 0);
  const totalActiveDays = allValues.length;
  const avgPerDay = allValues.length > 0
    ? Math.round(allValues.reduce((s, v) => s + v, 0) / allValues.length)
    : 0;
  const maxDay = allValues.length > 0 ? Math.max(...allValues) : 0;

  return (
    <div className="card-base p-5">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1 font-medium">
            Активность за полгода
          </div>
          <div className="text-4xl font-bold tracking-[-0.5px] text-text-primary drop-shadow-sm">
            {totalActiveDays} <span className="text-text-muted text-xl font-medium ml-1">дней</span>
          </div>
        </div>
      </div>

      {totalActiveDays > 0 && (
        <div className="flex gap-3 mb-6">
          {/* Статистика оформлена как вдавленные лотки */}
          <div className="flex-1 bg-[#141415] rounded-[1.25rem] p-4 border border-border-thin shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
            <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1 font-medium">
              В среднем
            </div>
            <div className="text-2xl font-bold tracking-[-0.5px] text-text-primary drop-shadow-sm">
              {avgPerDay.toLocaleString("ru-RU")}
            </div>
          </div>
          <div className="flex-1 bg-[#141415] rounded-[1.25rem] p-4 border border-border-thin shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
            <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1 font-medium">
              Рекорд за день
            </div>
            <div className="text-2xl font-bold tracking-[-0.5px] text-accent drop-shadow-[0_0_8px_rgba(50,215,75,0.3)]">
              {maxDay.toLocaleString("ru-RU")}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
        <div className="inline-block min-w-full">
          <div className="flex gap-[4px] mb-2 ml-[20px] text-[10px] uppercase tracking-widest text-text-muted font-medium">
            {monthLabels.map((m, i) => {
              const prevWeekIndex = i > 0 ? monthLabels[i - 1].weekIndex : 0;
              const weeksGap = m.weekIndex - prevWeekIndex;
              return (
                <span
                  key={i}
                  style={{
                    marginLeft: i === 0 ? 0 : `${(weeksGap - 1) * 17}px`,
                    display: "inline-block",
                    width: "34px",
                  }}
                >
                  {m.month}
                </span>
              );
            })}
          </div>

          <div className="flex gap-[4px]">
            <div className="flex flex-col gap-[4px] text-[9px] uppercase tracking-widest text-text-muted font-medium w-[16px] justify-around py-[1px]">
              <span>пн</span>
              <span></span>
              <span>ср</span>
              <span></span>
              <span>пт</span>
              <span></span>
              <span>вс</span>
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[4px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`relative w-[13px] h-[13px] rounded-[3px] transition-all duration-300 hover:scale-125 hover:z-10 ${
                      day.isFuture 
                        ? "bg-transparent" 
                        : getIntensityClass(day.value)
                    } ${
                      // Индикатор сегодняшнего дня переделан под премиальный ring
                      day.isToday 
                        ? "ring-1 ring-accent ring-offset-[1.5px] ring-offset-bg-card" 
                        : ""
                    }`}
                    title={day.isFuture ? "" : `${day.key}: ${day.value.toLocaleString("ru-RU")}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border-thin text-[10px] uppercase tracking-widest text-text-muted font-medium">
        <span>Меньше</span>
        <div className="flex items-center gap-1.5">
          {/* Легенда также использует функцию для генерации премиальных стилей */}
          <div className={`w-3 h-3 rounded-[2px] ${getIntensityClass(0)}`} />
          <div className={`w-3 h-3 rounded-[2px] ${getIntensityClass(1000)}`} />
          <div className={`w-3 h-3 rounded-[2px] ${getIntensityClass(5000)}`} />
          <div className={`w-3 h-3 rounded-[2px] ${getIntensityClass(10000)}`} />
          <div className={`w-3 h-3 rounded-[2px] ${getIntensityClass(20000)}`} />
        </div>
        <span>Больше</span>
      </div>
    </div>
  );
}