"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPool, migrateDatabase } from "@/lib/db";

export async function joinSeasonAction(disciplineIds: string[]): Promise<void> {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (!disciplineIds.length) return;

  await migrateDatabase();
  const db = getPool();

  await Promise.all(
    disciplineIds.map((id) =>
      db.query(
        `INSERT INTO user_disciplines (user_id, discipline_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, discipline_id) DO NOTHING`,
        [session.userId, id]
      )
    )
  );

  redirect("/season/current");
}
