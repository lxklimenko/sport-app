const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

// Оттенки строго выведены из акцентного цвета #B4A5FF. 
// Пустые дни прозрачные с тонкой рамкой.
function getIntensityClass(value: number): string {
  if (value === 0) return "bg-bg-muted border border-border-thin";
  if (value < 3000) return "bg-[#2E284D]"; // ~25% акцента на темном фоне
  if (value < 7000) return "bg-[#4E4380]"; // ~50%
  if (value < 15000) return "bg-[#7D6EB3]"; // ~75%
  return "bg-accent"; // 100% акцент
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
          <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
            Активность за полгода
          </div>
          <div className="text-4xl font-bold tracking-[-0.5px] text-text-primary">
            {totalActiveDays} <span className="text-text-muted text-lg font-normal ml-1">дней</span>
          </div>
        </div>
      </div>

      {totalActiveDays > 0 && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-bg-nested rounded-[1.25rem] p-4 border border-border-thin">
            <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
              В среднем
            </div>
            <div className="text-2xl font-bold tracking-[-0.5px] text-text-primary">
              {avgPerDay.toLocaleString("ru-RU")}
            </div>
          </div>
          <div className="flex-1 bg-bg-nested rounded-[1.25rem] p-4 border border-border-thin">
            <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
              Рекорд за день
            </div>
            {/* Единственный акцент применяется к рекорду */}
            <div className="text-2xl font-bold tracking-[-0.5px] text-accent">
              {maxDay.toLocaleString("ru-RU")}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
        <div className="inline-block min-w-full">
          <div className="flex gap-[4px] mb-2 ml-[20px] text-[10px] uppercase tracking-widest text-text-muted">
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
            <div className="flex flex-col gap-[4px] text-[9px] uppercase tracking-widest text-text-muted w-[16px] justify-around py-[1px]">
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
                    className={`w-[13px] h-[13px] rounded-[3px] transition-colors duration-200 ${
                      day.isFuture 
                        ? "bg-transparent" 
                        : getIntensityClass(day.value)
                    } ${
                      // Индикатор сегодняшнего дня переделан под чистый премиальный ring
                      day.isToday 
                        ? "ring-1 ring-accent ring-offset-2 ring-offset-bg-card" 
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

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border-thin text-[10px] uppercase tracking-widest text-text-muted">
        <span>Меньше</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[2px] bg-bg-muted border border-border-thin" />
          <div className="w-3 h-3 rounded-[2px] bg-[#2E284D]" />
          <div className="w-3 h-3 rounded-[2px] bg-[#4E4380]" />
          <div className="w-3 h-3 rounded-[2px] bg-[#7D6EB3]" />
          <div className="w-3 h-3 rounded-[2px] bg-accent" />
        </div>
        <span>Больше</span>
      </div>
    </div>
  );
}