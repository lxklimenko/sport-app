"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";

import { signup, type SignupState } from "@/app/actions/auth";

const initialState: SignupState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-full bg-[#C4EEDB] px-6 py-4 text-lg font-semibold text-[#062E2B] transition hover:bg-[#D8F6E9] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Создаем аккаунт..." : "Создать профиль"}
      <ArrowRight className="h-5 w-5" />
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signup, initialState);

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        await formAction(formData);
      }}
    >
      <label className="block">
        <span className="mb-2 block text-sm text-[#C4C7C5]">Имя</span>
        <input
          required
          name="name"
          placeholder="Например, Артем"
          className="w-full rounded-2xl border border-white/10 bg-[#23262B] px-4 py-4 outline-none transition focus:border-[#A8C7FA]"
        />
        {state.errors?.name ? (
          <p className="mt-2 text-sm text-[#FFB4AB]">{state.errors.name}</p>
        ) : null}
      </label>

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
          minLength={8}
          placeholder="Минимум 8 символов"
          className="w-full rounded-2xl border border-white/10 bg-[#23262B] px-4 py-4 outline-none transition focus:border-[#A8C7FA]"
        />
        {state.errors?.password ? (
          <p className="mt-2 text-sm text-[#FFB4AB]">{state.errors.password}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-[#C4C7C5]">
          Любимый формат
        </span>
        <select
          name="favoriteFormat"
          defaultValue="Шаги и кардио"
          className="w-full rounded-2xl border border-white/10 bg-[#23262B] px-4 py-4 outline-none transition focus:border-[#A8C7FA]"
        >
          <option>Шаги и кардио</option>
          <option>Силовые тренировки</option>
          <option>Бег и выносливость</option>
          <option>Функциональные батлы</option>
        </select>
        {state.errors?.favoriteFormat ? (
          <p className="mt-2 text-sm text-[#FFB4AB]">
            {state.errors.favoriteFormat}
          </p>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-[#C4C7C5]">Цель</span>
        <textarea
          name="goal"
          rows={4}
          placeholder="Хочу дойти до топ-10 по шагам и выкладывать свои тренировки каждый день"
          className="w-full resize-none rounded-2xl border border-white/10 bg-[#23262B] px-4 py-4 outline-none transition focus:border-[#A8C7FA]"
        />
      </label>

      {state.message ? (
        <p className="text-sm text-[#C4C7C5]">{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}