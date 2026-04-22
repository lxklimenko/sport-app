const DAY_LABELS = ["П", "В", "С", "Ч", "П", "С", "В"];

// Оставляем только строгие смысловые подписи уровней.
function getStreakSubtitle(current: number): string {
  if (current >= 30) return "Легендарная дисциплина";
  if (current >= 15) return "Редкая форма";
  if (current >= 8) return "Горячо";
  if (current >= 4) return "В ритме";
  return "Начало положено";
}

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

  const subtitle = getStreakSubtitle(current);

  return (
    <div className="card-base p-5">
      <div className="flex items-center gap-4 mb-6">
        
        {/* Иконка огня. Если серия активна, обводим зелёным акцентом */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 border ${
          current > 0 ? 'border-accent bg-bg-nested' : 'border-border-thin bg-bg-muted'
        }`}>
          <span className="text-3xl">🔥</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1 font-medium">
            Серия дисциплины
          </div>
          
          {current > 0 ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-[-0.5px] text-text-primary">
                  {current}
                </span>
                <span className="text-sm font-medium text-text-muted">
                  {current === 1 ? "день" : "дней подряд"}
                </span>
              </div>
              <div className="text-[12px] font-medium text-text-secondary mt-1">
                {subtitle}
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-bold tracking-[-0.5px] text-text-secondary">
                Серия прервалась
              </div>
              <div className="text-[11px] text-text-muted mt-1 leading-tight">
                Правило ненулевого дня: сделай хотя бы 1% сегодня
              </div>
            </>
          )}
        </div>

        {best > 0 && (
          <div className="text-right shrink-0">
            <div className="text-[11px] uppercase tracking-widest text-text-muted mb-1 font-medium">
              Рекорд
            </div>
            <div className="text-2xl font-bold tracking-[-0.5px] text-text-primary">
              {best}
            </div>
          </div>
        )}
      </div>

      {/* Блок дней недели: OLED-стиль с контрастными кружками */}
      <div className="bg-bg-nested rounded-[1.25rem] p-4 border border-border-thin">
        <div className="flex justify-between items-center">
          {weekDays.map((done, i) => {
            const isToday = i === todayIndex;
            return (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all border ${
                    done
                      ? "border-accent bg-accent" // Выполненные заливаем плотным Apple Green
                      : isToday
                      ? "border-accent bg-bg-main" // Сегодняшний контур
                      : "border-border-thin bg-bg-muted opacity-50" // Пропущенные/будущие глушим
                  }`}
                >
                  {done && (
                    // Галочка черного цвета для максимального контраста на зеленом
                    <svg className="w-4 h-4 text-black" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {isToday && !done && (
                    // Пульсирующая точка
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  )}
                </div>
                <span className={`text-[10px] uppercase tracking-widest ${
                  isToday ? "text-accent font-bold" : "text-text-muted font-medium"
                }`}>
                  {DAY_LABELS[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}