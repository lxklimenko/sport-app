const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

function getIntensity(value: number): string {
  if (value === 0) return "bg-[#1E1F22]";
  if (value < 3000) return "bg-[#1E3A2E]";
  if (value < 7000) return "bg-[#2D7A5F]";
  if (value < 15000) return "bg-[#4BAE7F]";
  return "bg-[#7FDBAA]";
}

export function ActivityHeatmap({ data }: { data: Record<string, number> }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();
  const todayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - todayOffset);

  const weeks: { date: Date; key: string; value: number; isFuture: boolean }[][] = [];
  const weeksCount = 26;
  const startDate = new Date(lastMonday);
  startDate.setDate(lastMonday.getDate() - (weeksCount - 1) * 7);

  for (let w = 0; w < weeksCount; w++) {
    const week: { date: Date; key: string; value: number; isFuture: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const isFuture = date.getTime() > today.getTime();
      week.push({
        date,
        key,
        value: data[key] ?? 0,
        isFuture,
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

  const totalActiveDays = Object.keys(data).filter(k => data[k] > 0).length;

  return (
    <div className="bg-[#1E1F22] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Активность за полгода</div>
        <div className="text-xs text-[#9AA0A6]">{totalActiveDays} активных дней</div>
      </div>

      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
        <div className="inline-block min-w-full">
          <div className="flex gap-[3px] mb-1 ml-[16px] text-[9px] text-[#9AA0A6]">
            {monthLabels.map((m, i) => {
              const prevWeekIndex = i > 0 ? monthLabels[i - 1].weekIndex : 0;
              const weeksGap = m.weekIndex - prevWeekIndex;
              return (
                <span
                  key={i}
                  style={{
                    marginLeft: i === 0 ? 0 : `${(weeksGap - 1) * 14}px`,
                    display: "inline-block",
                    width: "28px",
                  }}
                >
                  {m.month}
                </span>
              );
            })}
          </div>

          <div className="flex gap-[3px]">
            <div className="flex flex-col gap-[3px] text-[9px] text-[#9AA0A6] w-[14px] justify-around py-[1px]">
              <span>пн</span>
              <span></span>
              <span>ср</span>
              <span></span>
              <span>пт</span>
              <span></span>
              <span>вс</span>
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-[11px] h-[11px] rounded-[2px] ${
                      day.isFuture ? "bg-transparent" : getIntensity(day.value)
                    }`}
                    title={day.isFuture ? "" : `${day.key}: ${day.value.toLocaleString("ru-RU")}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 text-[10px] text-[#9AA0A6]">
        <span>меньше</span>
        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#1E3A2E]" />
        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#2D7A5F]" />
        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#4BAE7F]" />
        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#7FDBAA]" />
        <span>больше</span>
      </div>
    </div>
  );
}