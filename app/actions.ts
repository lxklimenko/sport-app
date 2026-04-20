"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getSessionUserId } from "@/lib/auth";
import {
  getActiveChallenge,
  getChallengeById,
  joinChallenge,
  addSteps,
} from "@/lib/challenges";
import { toggleLike, deletePost } from "@/lib/posts";

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
  redirect(`/challenge/${challenge.id}`);
}

export async function joinChallengeAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const challengeId = formData.get("challengeId");
  if (typeof challengeId !== "string" || !challengeId) {
    throw new Error("Не указан челлендж");
  }

  const challenge = await getChallengeById(challengeId);
  if (!challenge) {
    throw new Error("Челлендж не найден");
  }

  await joinChallenge(userId, challenge.id);

  revalidatePath("/");
  revalidatePath(`/challenge/${challenge.id}`);
  redirect(`/challenge/${challenge.id}`);
}

export async function addStepsAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const stepsRaw = formData.get("steps");
  const challengeId = formData.get("challengeId");
  const value = Number(stepsRaw);

  if (!value || isNaN(value) || value <= 0) {
    throw new Error("Введите корректное число");
  }

  let targetChallengeId: string;
  if (typeof challengeId === "string" && challengeId) {
    targetChallengeId = challengeId;
  } else {
    const active = await getActiveChallenge();
    if (!active) throw new Error("Нет активного челленджа");
    targetChallengeId = active.id;
  }

  await addSteps(userId, targetChallengeId, value);

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/challenge/${targetChallengeId}`);
}

export async function toggleLikeAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const postId = formData.get("postId");
  if (typeof postId !== "string" || !postId) {
    throw new Error("Не указан пост");
  }

  await toggleLike(userId, postId);
  revalidatePath("/profile");
}

export async function deletePostAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const postId = formData.get("postId");
  if (typeof postId !== "string" || !postId) {
    throw new Error("Не указан пост");
  }

  try {
    await deletePost(userId, postId);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND_OR_FORBIDDEN") {
      throw new Error("Нельзя удалить чужой пост");
    }
    throw error;
  }

  revalidatePath("/profile");
}