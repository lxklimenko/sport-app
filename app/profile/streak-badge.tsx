const DAY_LABELS = ["П", "В", "С", "Ч", "П", "С", "В"];

type FlameStyle = {
  gradient: string;
  glow: string;
  titleColor: string;
  subtitle: string;
};

function getFlameStyle(current: number): FlameStyle {
  if (current >= 30) {
    return {
      gradient: "from-[#FFD8A8] via-[#FF8A65] to-[#B4A5FF]",
      glow: "shadow-[0_0_40px_-8px_rgba(180,165,255,0.6)]",
      titleColor: "text-[#FFD8A8]",
      subtitle: "Легендарная дисциплина",
    };
  }
  if (current >= 15) {
    return {
      gradient: "from-[#FFB4D4] via-[#FF8A65] to-[#E074A8]",
      glow: "shadow-[0_0_40px_-8px_rgba(224,116,168,0.55)]",
      titleColor: "text-[#FFB4D4]",
      subtitle: "Редкая форма",
    };
  }
  if (current >= 8) {
    return {
      gradient: "from-[#FFD8A8] via-[#FF6B35] to-[#E24B4A]",
      glow: "shadow-[0_0_40px_-8px_rgba(255,107,53,0.5)]",
      titleColor: "text-[#FF8A65]",
      subtitle: "Горячо",
    };
  }
  if (current >= 4) {
    return {
      gradient: "from-[#FFE4A8] via-[#FFA726] to-[#FF6B35]",
      glow: "shadow-[0_0_32px_-8px_rgba(255,167,38,0.45)]",
      titleColor: "text-[#FFA726]",
      subtitle: "В ритме",
    };
  }
  return {
    gradient: "from-[#FFE4A8] to-[#FFA726]",
    glow: "shadow-[0_0_24px_-8px_rgba(255,167,38,0.35)]",
    titleColor: "text-[#FFE4A8]",
    subtitle: "Начало положено",
  };
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

  const style = getFlameStyle(current);

  return (
    <div className={`bg-[#1D1B26] rounded-[1.75rem] p-5 ${current > 0 ? style.glow : ""}`}>

      <div className="flex items-center gap-4 mb-5">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center shrink-0`}>
          <span className="text-3xl">🔥</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-[#8F8D9C] mb-1">
            Серия дисциплины
          </div>
          {current > 0 ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${style.titleColor}`}>
                  {current}
                </span>
                <span className="text-sm text-[#8F8D9C]">
                  {current === 1 ? "день" : "дней подряд"}
                </span>
              </div>
              <div className="text-[11px] text-[#C8C6D4] mt-0.5">
                {style.subtitle}
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-semibold text-[#8F8D9C]">
                Серия прервалась
              </div>
              <div className="text-[11px] text-[#8F8D9C] mt-0.5">
                Начни заново — добавь шаги сегодня
              </div>
            </>
          )}
        </div>

        {best > 0 && (
          <div className="text-right shrink-0">
            <div className="text-[9px] uppercase tracking-widest text-[#8F8D9C]">
              Рекорд
            </div>
            <div className="text-lg font-semibold">{best}</div>
          </div>
        )}
      </div>

      <div className="bg-[#14131D] rounded-2xl p-3">
        <div className="flex justify-between items-center mb-2">
          {weekDays.map((done, i) => {
            const isToday = i === todayIndex;
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    done
                      ? `bg-gradient-to-br ${style.gradient}`
                      : isToday
                      ? "bg-[#2B2839] border-2 border-[#B4A5FF]"
                      : "bg-[#2B2839]"
                  }`}
                >
                  {done && (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="#1D1B26"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {isToday && !done && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B4A5FF] animate-pulse" />
                  )}
                </div>
                <span className={`text-[9px] ${
                  isToday ? "text-[#B4A5FF] font-bold" : "text-[#8F8D9C]"
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