"use client";

import { useState } from "react";
import { Target, X } from "lucide-react";

import { setWeeklyGoalAction } from "@/app/actions";

type GoalData = {
  challengeId: string;
  challengeTitle: string;
  challengeEmoji: string;
  unitLabel: string;
  target: number;
  current: number;
  progress: number;
};

type ChallengeOption = {
  id: string;
  title: string;
  emoji: string;
  unitLabel: string;
};

export function WeeklyGoalsBlock({
  goals,
  availableChallenges,
}: {
  goals: GoalData[];
  availableChallenges: ChallengeOption[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<string>(
    availableChallenges[0]?.id ?? ""
  );

  const selectedChallengeData = availableChallenges.find(c => c.id === selectedChallenge);

  return (
    <div className="bg-[#1E1F22] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#FDE293]" />
          <div className="text-sm font-semibold">Цели на неделю</div>
        </div>
        {!showForm && availableChallenges.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-[#A8C7FA] hover:text-[#BBD6FE] transition font-semibold"
          >
            + Поставить
          </button>
        )}
      </div>

      {goals.length === 0 && !showForm && (
        <div className="text-xs text-[#9AA0A6] py-2">
          {availableChallenges.length === 0
            ? "Вступи в челлендж чтобы ставить цели"
            : "Поставь себе цель на эту неделю"}
        </div>
      )}

      {goals.length > 0 && (
        <div className="space-y-3 mb-3">
          {goals.map(goal => {
            const isDone = goal.current >= goal.target;
            return (
              <div key={goal.challengeId}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{goal.challengeEmoji}</span>
                    <span className="font-medium truncate">{goal.challengeTitle}</span>
                  </div>
                  <div className={`font-semibold ${isDone ? "text-[#7FDBAA]" : "text-[#E3E3E3]"}`}>
                    {goal.current.toLocaleString("ru-RU")} / {goal.target.toLocaleString("ru-RU")}
                  </div>
                </div>
                <div className="h-1.5 bg-[#2A2D33] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isDone ? "bg-[#7FDBAA]" : "bg-[#A8C7FA]"
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <div className="text-[10px] text-[#9AA0A6] mt-1">
                  {isDone 
                    ? "✓ Цель достигнута" 
                    : `${goal.progress}% · осталось ${(goal.target - goal.current).toLocaleString("ru-RU")} ${goal.unitLabel}`
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && availableChallenges.length > 0 && (
        <form action={setWeeklyGoalAction} className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold">Новая цель</div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[#9AA0A6] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <select
            name="challengeId"
            value={selectedChallenge}
            onChange={(e) => setSelectedChallenge(e.target.value)}
            className="w-full bg-black/30 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#A8C7FA]"
          >
            {availableChallenges.map(c => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.title}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              name="target"
              type="number"
              min="1"
              required
              placeholder={`Цель в ${selectedChallengeData?.unitLabel ?? "единицах"}`}
              className="flex-1 bg-black/30 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#A8C7FA] placeholder-[#9AA0A6]"
            />
            <button
              type="submit"
              className="bg-[#A8C7FA] text-[#062E6F] px-4 rounded-xl text-sm font-semibold hover:bg-[#BBD6FE] transition"
            >
              OK
            </button>
          </div>
        </form>
      )}
    </div>
  );
}