"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { editProfile, type EditProfileState } from "@/app/actions/auth";

const initialState: EditProfileState = {};

const FORMATS = [
  "Шаги и кардио",
  "Силовые тренировки",
  "Кроссфит",
  "Бег",
  "Йога",
  "Игровые виды",
  "Другое",
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-[#A8C7FA] text-[#062E6F] py-3 font-semibold hover:bg-[#BBD6FE] transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Сохраняем..." : "Сохранить"}
    </button>
  );
}

export function EditProfileForm({
  initialName,
  initialFormat,
  initialGoal,
}: {
  initialName: string;
  initialFormat: string;
  initialGoal: string;
}) {
  const [state, formAction] = useActionState(editProfile, initialState);

  return (
    <form action={formAction} className="space-y-5">

      <label className="block">
        <span className="block text-sm text-[#9AA0A6] mb-2 px-1">Имя</span>
        <input
          name="name"
          defaultValue={initialName}
          required
          minLength={2}
          maxLength={50}
          className="w-full bg-[#1E1F22] rounded-2xl px-4 py-3 text-base outline-none focus:ring-1 focus:ring-[#A8C7FA]"
        />
        {state.errors?.name && (
          <p className="mt-2 text-sm text-[#FFB4AB] px-1">{state.errors.name}</p>
        )}
      </label>

      <label className="block">
        <span className="block text-sm text-[#9AA0A6] mb-2 px-1">Любимый формат</span>
        <select
          name="favoriteFormat"
          defaultValue={initialFormat}
          required
          className="w-full bg-[#1E1F22] rounded-2xl px-4 py-3 text-base outline-none focus:ring-1 focus:ring-[#A8C7FA]"
        >
          {FORMATS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        {state.errors?.favoriteFormat && (
          <p className="mt-2 text-sm text-[#FFB4AB] px-1">{state.errors.favoriteFormat}</p>
        )}
      </label>

      <label className="block">
        <span className="block text-sm text-[#9AA0A6] mb-2 px-1">Цель</span>
        <textarea
          name="goal"
          defaultValue={initialGoal}
          rows={3}
          maxLength={200}
          placeholder="Например: попасть в топ-3 по шагам"
          className="w-full resize-none bg-[#1E1F22] rounded-2xl px-4 py-3 text-base outline-none focus:ring-1 focus:ring-[#A8C7FA] placeholder-[#9AA0A6]"
        />
      </label>

      <div className="pt-2">
        <SubmitButton />
      </div>

      {state.message && !state.errors && (
        <p className="text-center text-sm text-[#FFB4AB]">{state.message}</p>
      )}
    </form>
  );
}