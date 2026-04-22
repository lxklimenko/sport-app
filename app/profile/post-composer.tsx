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
      className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 active-scale"
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
    <section className="card-base p-6">
      <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2 font-medium">
        Новый пост
      </p>
      <h2 className="text-xl font-bold mb-5 tracking-[-0.5px]">
        Расскажи, что сделал сегодня
      </h2>

      <form action={formAction} className="space-y-4">
        {/* Поле ввода: OLED Black с тонкой рамкой, переходящей в акцент */}
        <div>
          <textarea
            name="workout"
            rows={3}
            placeholder="Что было на тренировке? Например: 5 км бег, 4 подхода подтягиваний"
            className="w-full resize-none rounded-[1.25rem] bg-bg-main border border-border-thin px-4 py-3 text-sm font-medium text-text-primary outline-none transition-colors focus:border-accent placeholder:text-text-muted placeholder:font-normal"
          />
          {state.errors?.workout && (
            <p className="text-[11px] font-medium text-danger mt-1.5 ml-2">
              {state.errors.workout}
            </p>
          )}
        </div>

        <div>
          <input
            name="stats"
            placeholder="Результат: 42 минуты · 540 ккал · рекорд"
            className="w-full rounded-[1.25rem] bg-bg-main border border-border-thin px-4 py-3 text-sm font-medium text-text-primary outline-none transition-colors focus:border-accent placeholder:text-text-muted placeholder:font-normal"
          />
          {state.errors?.stats && (
            <p className="text-[11px] font-medium text-danger mt-1.5 ml-2">
              {state.errors.stats}
            </p>
          )}
        </div>

        <input
          ref={fileInputRef}
          name="photo"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative rounded-[1.25rem] overflow-hidden bg-bg-main border border-border-thin group">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-80 object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute top-3 right-3 bg-bg-main/60 backdrop-blur-md rounded-full p-2 hover:bg-bg-hover transition-colors active-scale"
            >
              <X className="w-4 h-4 text-text-primary" />
            </button>
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-bg-main/60 backdrop-blur-md rounded-full border border-border-thin">
              <p className="text-[10px] font-medium text-text-primary truncate max-w-[200px]">
                {fileName}
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 rounded-[1.25rem] bg-bg-main border border-border-thin border-dashed px-4 py-4 cursor-pointer hover:border-text-muted transition-colors text-center active-scale group"
          >
            <ImagePlus className="w-5 h-5 text-text-muted group-hover:text-text-primary transition-colors" />
            <span className="text-sm font-medium text-text-muted group-hover:text-text-primary transition-colors">
              Добавить фото
            </span>
          </button>
        )}

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border-thin mt-2">
          <p className="text-[11px] font-medium text-text-muted flex-1">
            Коротко и по делу. Дисциплина любит факты.
          </p>
          <SubmitButton />
        </div>

        {state.message && (
          <p className="text-[11px] font-medium text-text-secondary text-center mt-2">
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}