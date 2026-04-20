"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImagePlus, Send, X } from "lucide-react";

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
      {pending ? "Публикуем..." : "Опубликовать"}
      <Send className="h-4 w-4" />
    </button>
  );
}

export function PostComposer() {
  const [state, formAction] = useActionState(publishPost, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      setFileName(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPreview(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className="rounded-3xl bg-[#1E1F22] p-5">
      <p className="text-xs uppercase tracking-widest text-[#9AA0A6] mb-2">
        Новый пост
      </p>
      <h2 className="text-xl font-semibold mb-4">
        Расскажи, что сделал сегодня
      </h2>

      <form action={formAction} className="space-y-3">
        <textarea
          name="workout"
          rows={3}
          placeholder="Что было на тренировке? Например: 5 км бег, 4 подхода подтягиваний"
          className="w-full resize-none rounded-2xl bg-black/30 px-4 py-3 text-base outline-none transition focus:ring-1 focus:ring-[#A8C7FA] placeholder-[#9AA0A6]"
        />
        {state.errors?.workout && (
          <p className="text-sm text-[#FFB4AB]">{state.errors.workout}</p>
        )}

        <input
          name="stats"
          placeholder="Результат: 42 минуты · 540 ккал · рекорд"
          className="w-full rounded-2xl bg-black/30 px-4 py-3 text-base outline-none transition focus:ring-1 focus:ring-[#A8C7FA] placeholder-[#9AA0A6]"
        />
        {state.errors?.stats && (
          <p className="text-sm text-[#FFB4AB]">{state.errors.stats}</p>
        )}

        <input
          ref={fileInputRef}
          name="photo"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative rounded-2xl overflow-hidden bg-black/30">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-80 object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-full p-2 hover:bg-black/80 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="absolute bottom-2 left-3 text-xs text-white/90 bg-black/40 backdrop-blur rounded-full px-2 py-0.5">
              {fileName}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 rounded-2xl bg-black/30 px-4 py-3 cursor-pointer hover:bg-black/50 transition text-left"
          >
            <ImagePlus className="w-5 h-5 text-[#9AA0A6]" />
            <span className="text-sm text-[#9AA0A6]">Добавить фото</span>
          </button>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-[#9AA0A6] flex-1">
            Коротко и по делу
          </p>
          <SubmitButton />
        </div>

        {state.message && (
          <p className="text-sm text-[#C4C7C5]">{state.message}</p>
        )}
      </form>
    </section>
  );
}