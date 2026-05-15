"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPool } from "@/lib/db";

const DAILY_LIMITS: Record<string, { maxTotal: number; maxEntries: number }> = {
  steps:   { maxTotal: 100_000, maxEntries: 20 },
  running: { maxTotal: 100,     maxEntries: 20 },
  burpees: { maxTotal: 1_000,   maxEntries: 20 },
};

export type RecordState = { error?: string };

export async function recordActivity(
  disciplineId: string,
  _prev: RecordState,
  formData: FormData
): Promise<RecordState> {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  if (!Object.keys(DAILY_LIMITS).includes(disciplineId)) {
    return { error: "Неизвестная дисциплина" };
  }

  const raw = formData.get("value");
  const value = Number(raw);
  if (!isFinite(value) || value <= 0) return { error: "Введи значение больше нуля" };

  const db = getPool();

  // User must be enrolled in this discipline
  const enrolled = await db.query(
    "SELECT 1 FROM user_disciplines WHERE user_id = $1 AND discipline_id = $2",
    [session.userId, disciplineId]
  );
  if (enrolled.rows.length === 0) redirect("/onboarding");

  // Daily anti-spam checks
  const stats = await db.query(
    `SELECT COUNT(*) AS entries, COALESCE(SUM(value), 0) AS total
     FROM activities
     WHERE user_id = $1 AND discipline_id = $2 AND recorded_at::date = CURRENT_DATE`,
    [session.userId, disciplineId]
  );
  const entries = parseInt(stats.rows[0].entries, 10);
  const total = parseFloat(stats.rows[0].total);
  const limits = DAILY_LIMITS[disciplineId];

  if (entries >= limits.maxEntries) return { error: "Лимит записей на сегодня (20)" };
  if (total + value > limits.maxTotal) {
    return { error: `Дневной лимит: ${limits.maxTotal.toLocaleString("ru")}` };
  }

  await db.query(
    "INSERT INTO activities (user_id, discipline_id, value) VALUES ($1, $2, $3)",
    [session.userId, disciplineId, value]
  );

  redirect(`/season/current?d=${disciplineId}`);
}
