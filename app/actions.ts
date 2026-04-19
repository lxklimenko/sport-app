"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getSessionUserId } from "@/lib/auth";
import {
  getActiveChallenge,
  joinChallenge,
  addSteps,
} from "@/lib/challenges";

export async function joinActiveChallengeAction() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const challenge = await getActiveChallenge();
  if (!challenge) {
    throw new Error("Нет активного челленджа");
  }

  await joinChallenge(userId, challenge.id);

  revalidatePath("/");
  revalidatePath("/profile");
  redirect("/profile");
}

export async function addStepsAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const stepsRaw = formData.get("steps");
  const steps = Number(stepsRaw);

  if (!steps || isNaN(steps) || steps <= 0 || steps > 50000) {
    throw new Error("Введите число от 1 до 50 000");
  }

  const challenge = await getActiveChallenge();
  if (!challenge) {
    throw new Error("Нет активного челленджа");
  }

  await addSteps(userId, challenge.id, steps);

  revalidatePath("/");
  revalidatePath("/profile");
}