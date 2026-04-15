"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Send } from "lucide-react";

import { publishPost, type CreatePostState } from "@/app/actions/auth";

const initialState: CreatePostState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-[#A8C7FA] px-5 py-3 font-semibold text-[#062E6F] transition hover:bg-[#BBD6FE] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Публикуем..." : "Добавить пост"}
      {pending ? <Plus className="h-4 w-4" /> : <Send className="h-4 w-4" />}
    </button>
  );
}

export function PostComposer() {
  const [state, formAction] = useActionState(publishPost, initialState);

  return (
    <section className="rounded-[2rem] bg-[#171A1F] p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[#9AA0A6]">
            Новый пост
          </p>
          <h2 className="mt-2 text-3xl font-semibold">
            Расскажи, что сделал сегодня
          </h2>
        </div>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-[#C4C7C5]">
            Что было на тренировке
          </span>
          <textarea
            name="workout"
            rows={4}
            placeholder="Например: 5 км бег, потом 4 подхода подтягиваний и пресс"
            className="w-full resize-none rounded-[1.4rem] border border-white/10 bg-[#111318] px-4 py-4 outline-none transition focus:border-[#A8C7FA]"
          />
          {state.errors?.workout ? (
            <p className="mt-2 text-sm text-[#FFB4AB]">{state.errors.workout}</p>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-[#C4C7C5]">
            Результат и детали
          </span>
          <input
            name="stats"
            placeholder="Например: 42 минуты • 540 ккал • рекорд по темпу"
            className="w-full rounded-[1.4rem] border border-white/10 bg-[#111318] px-4 py-4 outline-none transition focus:border-[#A8C7FA]"
          />
          {state.errors?.stats ? (
            <p className="mt-2 text-sm text-[#FFB4AB]">{state.errors.stats}</p>
          ) : null}
        </label>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-[#9AA0A6]">
            Коротко, но по делу: что сделал и какой результат получил.
          </p>
          <SubmitButton />
        </div>

        {state.message ? (
          <p className="text-sm text-[#C4C7C5]">{state.message}</p>
        ) : null}
      </form>
    </section>
  );
}
