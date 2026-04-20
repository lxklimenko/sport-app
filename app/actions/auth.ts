"use server";

import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSession, clearSession, getSessionUserId } from "@/lib/auth";
import { createPost } from "@/lib/posts";
import {
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,
} from "@/lib/users";

export type SignupState = {
  errors?: {
    name?: string;
    email?: string;
    password?: string;
    favoriteFormat?: string;
  };
  message?: string;
};

export type LoginState = {
  errors?: {
    email?: string;
    password?: string;
  };
  message?: string;
};

export type CreatePostState = {
  errors?: {
    workout?: string;
    stats?: string;
  };
  message?: string;
};

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const name = getString(formData, "name");
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const favoriteFormat = getString(formData, "favoriteFormat");
  const goal = getString(formData, "goal");

  const errors: SignupState["errors"] = {};

  if (name.length < 2) {
    errors.name = "Имя должно быть не короче 2 символов.";
  }

  if (!email.includes("@")) {
    errors.email = "Нужен корректный email.";
  }

  if (password.length < 8) {
    errors.password = "Пароль должен быть не короче 8 символов.";
  }

  if (!favoriteFormat) {
    errors.favoriteFormat = "Выбери основной формат тренировок.";
  }

  if (errors.name || errors.email || errors.password || errors.favoriteFormat) {
    return {
      errors,
      message: "Исправь поля формы и попробуй еще раз.",
    };
  }

  try {
    const user = await createUser({
      name,
      email,
      password,
      favoriteFormat,
      goal,
    });

    await createSession(user.id);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_EXISTS") {
      return {
        errors: {
          email: "Пользователь с таким email уже существует.",
        },
        message: "Этот email уже зарегистрирован.",
      };
    }

    return {
      message: "Не удалось создать аккаунт. Попробуй еще раз.",
    };
  }

  redirect("/profile");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const errors: LoginState["errors"] = {};

  if (!email.includes("@")) {
    errors.email = "Нужен корректный email.";
  }

  if (!password) {
    errors.password = "Введи пароль.";
  }

  if (errors.email || errors.password) {
    return {
      errors,
      message: "Проверь форму и попробуй еще раз.",
    };
  }

  try {
    const user = await getUserByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return {
        errors: {
          email: "Неверный email или пароль.",
          password: "Неверный email или пароль.",
        },
        message: "Не удалось войти в аккаунт.",
      };
    }

    await createSession(user.id);
  } catch {
    return {
      message: "Не удалось выполнить вход. Попробуй еще раз.",
    };
  }

  redirect("/profile");
}

export async function publishPost(
  _prevState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/login");
  }

  const user = await getUserById(userId);
  if (!user) {
    redirect("/login");
  }

  const workout = getString(formData, "workout");
  const stats = getString(formData, "stats");
  const photo = formData.get("photo");

  const errors: CreatePostState["errors"] = {};

  if (workout.length < 8) {
    errors.workout = "Опиши тренировку чуть подробнее.";
  }

  if (stats.length < 4) {
    errors.stats = "Добавь время, калории или другой результат.";
  }

  if (errors.workout || errors.stats) {
    return {
      errors,
      message: "Не получилось опубликовать пост. Поправь поля.",
    };
  }

  let imageUrl: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024) {
      return {
        message: "Фото слишком большое. Максимум 5 МБ.",
      };
    }

    if (!photo.type.startsWith("image/")) {
      return {
        message: "Нужен файл изображения (jpg, png, webp).",
      };
    }

    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });

      const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${randomUUID()}.${ext}`;
      const filepath = path.join(uploadsDir, filename);

      const bytes = await photo.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));

      imageUrl = `/uploads/${filename}`;
    } catch (error) {
      console.error("Photo upload error:", error);
      return {
        message: "Не удалось сохранить фото. Попробуй ещё раз.",
      };
    }
  }

  try {
    await createPost({
      userId: user.id,
      authorName: user.name,
      workout,
      stats,
      imageUrl,
    });
  } catch {
    return {
      message: "Не удалось сохранить пост. Попробуй еще раз.",
    };
  }

  revalidatePath("/profile");

  return {
    message: "Пост опубликован в ленте.",
  };
}
