"use client";

import { useActionState, useRef, useEffect } from "react";
import { recordActivity, RecordState } from "@/app/actions/record";

const CONFIG = {
  steps: {
    emoji: "👟",
    name: "Шаги",
    unit: "шагов",
    placeholder: "0",
    quickAdds: [1000, 3000, 5000],
    formatToday: (v: number) => v.toLocaleString("ru"),
  },
  running: {
    emoji: "🏃",
    name: "Бег",
    unit: "км",
    placeholder: "0",
    quickAdds: [1, 3, 5],
    formatToday: (v: number) => v.toFixed(1),
  },
  burpees: {
    emoji: "💥",
    name: "Бёрпи",
    unit: "повт.",
    placeholder: "0",
    quickAdds: [10, 25, 50],
    formatToday: (v: number) => String(Math.floor(v)),
  },
} as const;

type DisciplineId = keyof typeof CONFIG;

const initialState: RecordState = {};

export function RecordForm({
  disciplineId,
  todayTotal,
  eventSlug,
  eventTitle,
  eventEmoji,
}: {
  disciplineId: string;
  todayTotal: number;
  eventSlug?: string | null;
  eventTitle?: string | null;
  eventEmoji?: string | null;
}) {
  const cfg = CONFIG[disciplineId as DisciplineId] ?? CONFIG.steps;
  const boundAction = recordActivity.bind(null, disciplineId, eventSlug ?? null);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function addQuick(amount: number) {
    if (!inputRef.current) return;
    const current = parseFloat(inputRef.current.value) || 0;
    const next = parseFloat((current + amount).toFixed(1));
    inputRef.current.value = String(next);
    inputRef.current.focus();
  }

  return (
    <form action={formAction} className="flex flex-col flex-1">

      {/* EVENT CONTEXT */}
      {eventTitle && (
        <div className="mb-4 px-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <span className="text-[12px]">{eventEmoji ?? "📅"}</span>
            <span className="text-[11px] text-white/60 font-medium">{eventTitle}</span>
          </div>
        </div>
      )}

      {/* CURRENT PROGRESS */}
      {todayTotal > 0 && (
        <div className="mb-6 px-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-1">Сегодня уже</p>
          <p className="text-[22px] font-semibold tracking-tight text-white/60">
            {cfg.formatToday(todayTotal)}
            <span className="text-[14px] text-white/30 ml-1.5">{cfg.unit}</span>
          </p>
        </div>
      )}

      {/* BIG INPUT */}
      <div className="flex-1 flex flex-col items-center justify-center mb-8">
        <div className="relative w-full text-center">
          <input
            ref={inputRef}
            type="number"
            name="value"
            min="1"
            step={disciplineId === "running" ? "0.1" : "1"}
            placeholder={cfg.placeholder}
            inputMode="decimal"
            className={[
              "w-full bg-transparent text-center font-semibold tracking-[-0.04em] outline-none",
              "text-[80px] leading-none text-white",
              "placeholder:text-white/10",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            ].join(" ")}
          />
          <p className="mt-3 text-[13px] uppercase tracking-[0.2em] text-white/30">
            {cfg.unit}
          </p>
        </div>
      </div>

      {/* QUICK ADDS */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {cfg.quickAdds.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => addQuick(amount)}
            className="h-12 rounded-[16px] border border-white/[0.08] bg-white/[0.04] text-[15px] font-semibold text-white/70 active:scale-[0.97] active:bg-white/[0.07] transition-all"
          >
            +{amount}
          </button>
        ))}
      </div>

      {/* ERROR */}
      {state.error && (
        <p className="mb-4 text-center text-[13px] text-[#FFB4AB] font-medium">
          {state.error}
        </p>
      )}

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={pending}
        className="w-full h-14 rounded-[20px] bg-[#F3F3F3] text-black text-[14px] font-semibold flex items-center justify-center active:scale-[0.985] transition-all disabled:opacity-60 shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
      >
        {pending ? "Фиксируем..." : "ЗАФИКСИРОВАТЬ"}
      </button>

    </form>
  );
}
