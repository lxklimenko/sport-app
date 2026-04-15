"use server";

import { redirect } from "next/navigation";

import { createSession, clearSession } from "@/lib/auth";
import { createUser, getUserByEmail, verifyPassword } from "@/lib/users";

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
