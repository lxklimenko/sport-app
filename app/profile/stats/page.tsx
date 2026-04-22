import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import {
  getUserById,
  getUserStreak,
  getActivityHeatmap,
  getWeeklyProgress,
} from "@/lib/users";
import { getUserAchievements, checkAndUnlockAchievements } from "@/lib/achievements";
import { getMyWeeklyGoals } from "@/lib/goals";
import { getMyChallenges } from "@/lib/challenges";
import { StreakBadge } from "@/app/profile/streak-badge";
import { ActivityHeatmap } from "@/app/profile/heatmap";
import { WeeklyChart } from "@/app/profile/weekly-chart";
import { AchievementsBadges } from "@/app/profile/achievements";
import { WeeklyGoalsBlock } from "@/app/profile/weekly-goals";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/signup");

  const user = await getUserById(userId);
  if (!user) redirect("/signup");

  await checkAndUnlockAchievements(userId);

  const [
    streak,
    heatmap,
    weeklyProgress,
    achievements,
    weeklyGoals,
    myChallenges,
  ] = await Promise.all([
    getUserStreak(userId),
    getActivityHeatmap(userId),
    getWeeklyProgress(userId),
    getUserAchievements(userId),
    getMyWeeklyGoals(userId),
    getMyChallenges(userId, true),
  ]);

  const availableChallenges = myChallenges.map(c => ({
    id: c.challenge.id,
    title: c.challenge.title,
    emoji: c.challenge.emoji,
    unitLabel: c.challenge.unitLabel,
  }));

  return (
    <main className="min-h-screen bg-[#000] text-white pb-24">

      <div className="sticky top-0 z-10 bg-[#000]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link
          href="/profile"
          className="p-2 -ml-2 hover:bg-white/5 rounded-full transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold">Статистика</h1>
      </div>

      <div className="mx-auto max-w-2xl p-4 space-y-3">

        <StreakBadge
          current={streak.current}
          best={streak.best}
          weekDays={streak.weekDays}
        />

        <ActivityHeatmap data={heatmap} />

        <WeeklyChart weeks={weeklyProgress.weeks} />

        <WeeklyGoalsBlock
          goals={weeklyGoals}
          availableChallenges={availableChallenges}
        />

        <AchievementsBadges unlocked={achievements} />

      </div>
    </main>
  );
}