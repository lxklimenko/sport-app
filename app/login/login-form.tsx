"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";

import { login, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-full bg-[#A8C7FA] px-6 py-4 text-lg font-semibold text-[#062E6F] transition hover:bg-[#BBD6FE] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Входим..." : "Войти в профиль"}
      <ArrowRight className="h-5 w-5" />
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <label className="block">
        <span className="mb-2 block text-sm text-[#C4C7C5]">Email</span>
        <input
          required
          name="email"
          type="email"
          placeholder="you@sport.club"
          className="w-full rounded-2xl border border-white/10 bg-[#23262B] px-4 py-4 outline-none transition focus:border-[#A8C7FA]"
        />
        {state.errors?.email ? (
          <p className="mt-2 text-sm text-[#FFB4AB]">{state.errors.email}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-[#C4C7C5]">Пароль</span>
        <input
          required
          name="password"
          type="password"
          placeholder="Твой пароль"
          className="w-full rounded-2xl border border-white/10 bg-[#23262B] px-4 py-4 outline-none transition focus:border-[#A8C7FA]"
        />
        {state.errors?.password ? (
          <p className="mt-2 text-sm text-[#FFB4AB]">{state.errors.password}</p>
        ) : null}
      </label>

      {state.message ? (
        <p className="text-sm text-[#C4C7C5]">{state.message}</p>
      ) : null}

      <SubmitButton />

      <p className="text-sm text-[#9AA0A6]">
        Нет аккаунта?{" "}
        <Link href="/signup" className="text-white underline underline-offset-4">
          Создать профиль
        </Link>
      </p>
    </form>
  );
}
