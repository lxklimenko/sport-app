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
import { toggleFollow } from "@/lib/follows";
import { createComment, deleteComment } from "@/lib/comments";
import { getUserById } from "@/lib/users";
import { sendMessage } from "@/lib/messages"; // добавленный импорт
import { checkAndUnlockAchievements } from "@/lib/achievements"; // добавлено
import { setWeeklyGoal } from "@/lib/goals"; // добавлено для недельной цели

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
  await checkAndUnlockAchievements(userId); // добавлено
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
  await checkAndUnlockAchievements(userId); // добавлено
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
  await checkAndUnlockAchievements(userId); // добавлено
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

  // Получаем владельца поста и проверяем его достижения
  const postResult = await (await import("@/lib/db")).getPool().query<{ user_id: string }>(
    `SELECT user_id FROM posts WHERE id = $1`,
    [postId]
  );
  const postOwnerId = postResult.rows[0]?.user_id;
  if (postOwnerId) await checkAndUnlockAchievements(postOwnerId); // добавлено
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

export async function addCommentAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const user = await getUserById(userId);
  if (!user) {
    redirect("/login");
  }

  const postId = formData.get("postId");
  const text = String(formData.get("text") ?? "").trim();

  if (typeof postId !== "string" || !postId) {
    throw new Error("Не указан пост");
  }

  if (text.length < 1 || text.length > 500) {
    throw new Error("Комментарий должен быть от 1 до 500 символов");
  }

  await createComment({
    postId,
    userId: user.id,
    authorName: user.name,
    text,
  });

  revalidatePath("/profile");
  await checkAndUnlockAchievements(userId); // добавлено
}

export async function toggleFollowAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const followingId = formData.get("userId");
  if (typeof followingId !== "string" || !followingId) {
    throw new Error("Не указан пользователь");
  }

  await toggleFollow(userId, followingId);
  revalidatePath(`/user/${followingId}`);
  revalidatePath("/profile");
  revalidatePath("/users");
  revalidatePath("/feed");
  await checkAndUnlockAchievements(followingId); // добавлено
}

export async function deleteCommentAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const commentId = formData.get("commentId");
  if (typeof commentId !== "string" || !commentId) {
    throw new Error("Не указан комментарий");
  }

  try {
    await deleteComment(userId, commentId);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND_OR_FORBIDDEN") {
      throw new Error("Нельзя удалить чужой комментарий");
    }
    throw error;
  }

  revalidatePath("/profile");
}

export async function sendMessageAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const receiverId = formData.get("receiverId");
  const text = String(formData.get("text") ?? "").trim();

  if (typeof receiverId !== "string" || !receiverId) {
    throw new Error("Не указан получатель");
  }

  if (!text) {
    throw new Error("Введите текст");
  }

  await sendMessage({ senderId: userId, receiverId, text });

  revalidatePath(`/chat/${receiverId}`);
  revalidatePath("/messages");
}

export async function setWeeklyGoalAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const challengeId = formData.get("challengeId");
  const targetRaw = formData.get("target");

  if (typeof challengeId !== "string" || !challengeId) {
    throw new Error("Не указан челлендж");
  }

  const target = Number(targetRaw);
  if (!target || isNaN(target) || target <= 0) {
    throw new Error("Введите корректное число");
  }

  await setWeeklyGoal(userId, challengeId, target);
  revalidatePath("/profile");
}