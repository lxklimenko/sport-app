"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signup, type AuthState } from "@/app/actions/auth";

const INPUT =
  "w-full rounded-[16px] border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-white/25 focus:bg-white/[0.06]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-12 rounded-[16px] bg-[#F3F3F3] text-black text-[14px] font-semibold transition active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Создаём..." : "Создать профиль"}
    </button>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<AuthState, FormData>(signup, {});

  return (
    <form action={action} className="space-y-3">
      <div>
        <input
          name="name"
          required
          placeholder="Имя"
          autoComplete="name"
          className={INPUT}
        />
      </div>
      <div>
        <input
          name="email"
          type="email"
          required
          placeholder="Почта"
          autoComplete="email"
          className={INPUT}
        />
      </div>
      <div>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Пароль · минимум 8 символов"
          autoComplete="new-password"
          className={INPUT}
        />
      </div>

      {state.error && (
        <p className="text-sm text-[#FFB4AB] px-1">{state.error}</p>
      )}

      <div className="pt-1">
        <SubmitButton />
      </div>
    </form>
  );
}
