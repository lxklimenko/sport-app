const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

function getIntensity(value: number): string {
  if (value === 0) return "bg-[#14131D]";
  if (value < 3000) return "bg-[#3A2F5C]";
  if (value < 7000) return "bg-[#6B57B8]";
  if (value < 15000) return "bg-[#9282E0]";
  return "bg-[#B4A5FF]";
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
    <div className="bg-[#1D1B26] rounded-[1.75rem] p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#8F8D9C] mb-1">
            Активность за полгода
          </div>
          <div className="text-lg font-semibold">
            {totalActiveDays} <span className="text-[#8F8D9C] text-sm font-normal">активных дней</span>
          </div>
        </div>
      </div>

      {totalActiveDays > 0 && (
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-[#14131D] rounded-xl p-2.5">
            <div className="text-[9px] uppercase tracking-widest text-[#8F8D9C]">
              В среднем
            </div>
            <div className="text-sm font-semibold mt-0.5">
              {avgPerDay.toLocaleString("ru-RU")}
            </div>
          </div>
          <div className="flex-1 bg-[#14131D] rounded-xl p-2.5">
            <div className="text-[9px] uppercase tracking-widest text-[#8F8D9C]">
              Рекорд за день
            </div>
            <div className="text-sm font-semibold mt-0.5 text-[#FFD8A8]">
              {maxDay.toLocaleString("ru-RU")}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
        <div className="inline-block min-w-full">
          <div className="flex gap-[4px] mb-1.5 ml-[18px] text-[9px] text-[#8F8D9C]">
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
            <div className="flex flex-col gap-[4px] text-[9px] text-[#8F8D9C] w-[14px] justify-around py-[1px]">
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
                    className={`w-[13px] h-[13px] rounded-[3px] transition ${
                      day.isFuture 
                        ? "bg-transparent" 
                        : getIntensity(day.value)
                    } ${
                      day.isToday 
                        ? "ring-2 ring-[#B4A5FF] ring-offset-1 ring-offset-[#1D1B26]" 
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

      <div className="flex items-center justify-between mt-4 text-[10px] text-[#8F8D9C]">
        <span>меньше</span>
        <div className="flex items-center gap-1">
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#14131D]" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#3A2F5C]" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#6B57B8]" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#9282E0]" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#B4A5FF]" />
        </div>
        <span>больше</span>
      </div>
    </div>
  );
}