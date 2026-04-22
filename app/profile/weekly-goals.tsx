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
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {/* Иконка стала нейтрально-серой */}
          <Target className="w-4 h-4 text-text-muted" />
          <div className="text-[10px] uppercase tracking-widest text-text-muted">
            Цели на неделю
          </div>
        </div>
        {!showForm && availableChallenges.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="text-[10px] uppercase tracking-widest text-accent font-bold hover:text-accent-hover transition-colors"
          >
            + Добавить
          </button>
        )}
      </div>

      {goals.length === 0 && !showForm && (
        <div className="text-[11px] text-text-muted py-2">
          {availableChallenges.length === 0
            ? "Вступи в челлендж чтобы ставить цели"
            : "Дисциплина требует конкретики. Задай планку на неделю."}
        </div>
      )}

      {goals.length > 0 && (
        <div className="space-y-6 mb-2">
          {goals.map(goal => {
            const isDone = goal.current >= goal.target;
            return (
              <div key={goal.challengeId} className="group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl">{goal.challengeEmoji}</span>
                    <span className="text-sm font-medium text-text-primary truncate">
                      {goal.challengeTitle}
                    </span>
                  </div>
                  {/* Крупные цифры для отслеживания прогресса */}
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold tracking-[-0.5px] text-text-primary">
                      {goal.current.toLocaleString("ru-RU")}
                      <span className="text-text-muted text-sm font-normal ml-1">
                        / {goal.target.toLocaleString("ru-RU")}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Ультратонкий прогресс-бар: серый в процессе, лавандовый при выполнении */}
                <div className="h-1 bg-bg-muted rounded-full overflow-hidden border border-border-thin">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isDone ? "bg-accent" : "bg-text-secondary"
                    }`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
                
                {/* Uppercase подписи */}
                <div className="text-[9px] uppercase tracking-widest text-text-muted mt-2">
                  {isDone ? (
                    <span className="text-accent font-bold">✓ Выполнено</span>
                  ) : (
                    `${goal.progress}% · осталось ${(goal.target - goal.current).toLocaleString("ru-RU")} ${goal.unitLabel}`
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && availableChallenges.length > 0 && (
        <form action={setWeeklyGoalAction} className="space-y-3 pt-5 mt-4 border-t border-border-thin">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-widest text-text-secondary">
              Новая цель
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-text-muted hover:text-text-primary transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <select
            name="challengeId"
            value={selectedChallenge}
            onChange={(e) => setSelectedChallenge(e.target.value)}
            className="w-full bg-bg-nested border border-border-thin rounded-[1rem] px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors appearance-none"
          >
            {availableChallenges.map(c => (
              <option key={c.id} value={c.id} className="bg-bg-card">
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
              placeholder={`Цель в ${selectedChallengeData?.unitLabel ?? "ед."}`}
              className="flex-1 bg-bg-nested border border-border-thin rounded-[1rem] px-4 py-3 text-sm text-text-primary outline-none focus:border-accent placeholder:text-text-muted transition-colors"
            />
            {/* Кнопка с тактильным откликом active-scale */}
            <button
              type="submit"
              className="bg-accent text-text-on-accent px-6 rounded-[1rem] text-sm font-bold active-scale hover:bg-accent-hover transition-colors"
            >
              ОК
            </button>
          </div>
        </form>
      )}
    </div>
  );
}