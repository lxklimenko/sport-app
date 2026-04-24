"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { ImagePlus, Send, X, Zap, Camera as CameraIcon } from "lucide-react";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

import { publishPost, type CreatePostState } from "@/app/actions/auth";

const initialState: CreatePostState = {};

function SubmitButton({ isMicroStep }: { isMicroStep: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold transition-all active:scale-[0.98] ${
        isMicroStep
          ? "bg-[#1C3523] border border-[#32D74B]/50 text-[#32D74B] shadow-[0_0_15px_-5px_rgba(50,215,75,0.4)]"
          : "bg-[#32D74B] text-black hover:bg-[#42E75B]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {pending ? "Публикуем..." : isMicroStep ? "Сохранить прогресс" : "Опубликовать"}
      <Send className="h-4 w-4" />
    </button>
  );
}

export function PostComposer() {
  const [state, formAction] = useActionState(publishPost, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isMicroStep, setIsMicroStep] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      setPhotoFile(null);
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const takePhoto = async (source: CameraSource) => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: source
      });

      if (image.webPath) {
        setPreview(image.webPath);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], `photo.${image.format}`, { type: `image/${image.format}` });
        setPhotoFile(file);
      }
    } catch (e) {
      console.error('Camera error', e);
    }
  };

  const clearPhoto = () => {
    setPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (formData: FormData) => {
    if (photoFile) {
      formData.set("photo", photoFile);
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      formAction(formData);
    } catch (e) {}
  };

  useEffect(() => {
    if (state.message && state.message.includes('опубликован')) {
      Haptics.notification({ type: ImpactStyle.Light }).catch(() => {});
    }
  }, [state.message]);

  return (
    <section
      className={`bg-[#1C1C1E] rounded-[1.5rem] p-5 transition-all duration-500 ${
        isMicroStep
          ? "border border-[#32D74B]/30 shadow-[0_0_20px_-10px_rgba(50,215,75,0.3)]"
          : "border border-white/5"
      }`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#8E8E93] mb-1 font-medium">
            Новый пост
          </p>
          <h2 className="text-xl font-bold tracking-tight">
            {isMicroStep ? "Ненулевой день" : "Что сделано сегодня?"}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsMicroStep(!isMicroStep)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all active:scale-[0.95] ${
            isMicroStep
              ? "bg-[#32D74B]/10 border-[#32D74B] text-[#32D74B]"
              : "bg-[#242426] border-white/10 text-[#8E8E93]"
          }`}
        >
          <Zap
            className={`w-3.5 h-3.5 ${isMicroStep ? "fill-[#32D74B]" : ""}`}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            1% Rule
          </span>
        </button>
      </div>

      <form action={handleSubmit} className="space-y-3">
        <input type="hidden" name="isMicroStep" value={String(isMicroStep)} />

        <textarea
          name="workout"
          rows={isMicroStep ? 2 : 3}
          placeholder={
            isMicroStep
              ? "Минимальное действие, которое спасло день..."
              : "5 км бег, 4 подхода подтягиваний..."
          }
          className="w-full resize-none rounded-2xl bg-black/30 border border-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#32D74B] placeholder:text-[#8E8E93]"
        />
        {state.errors?.workout && (
          <p className="text-sm text-[#FF453A] px-1">{state.errors.workout}</p>
        )}

        {!isMicroStep && (
          <>
            <input
              name="stats"
              placeholder="Результат: 42 минуты · 540 ккал"
              className="w-full rounded-2xl bg-black/30 border border-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#32D74B] placeholder:text-[#8E8E93]"
            />
            {state.errors?.stats && (
              <p className="text-sm text-[#FF453A] px-1">{state.errors.stats}</p>
            )}
          </>
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
          <div className="relative rounded-2xl overflow-hidden bg-black/30 border border-white/5">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-80 object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute top-3 right-3 bg-black/60 backdrop-blur rounded-full p-2 hover:bg-black/80 transition"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : !isMicroStep ? (
          <div className="flex gap-2">
            {isNative && (
              <button
                type="button"
                onClick={() => takePhoto(CameraSource.Camera)}
                className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/30 border border-white/5 border-dashed px-4 py-6 hover:border-white/20 transition active:scale-[0.98]"
              >
                <CameraIcon className="w-6 h-6 text-[#8E8E93]" />
                <span className="text-xs text-[#8E8E93]">Камера</span>
              </button>
            )}
            <button
              type="button"
              onClick={isNative ? () => takePhoto(CameraSource.Photos) : () => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/30 border border-white/5 border-dashed px-4 py-6 hover:border-white/20 transition active:scale-[0.98]"
            >
              <ImagePlus className="w-6 h-6 text-[#8E8E93]" />
              <span className="text-xs text-[#8E8E93]">{isNative ? "Галерея" : "Добавить фото"}</span>
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
          <p className="text-[11px] text-[#8E8E93] flex-1 leading-tight">
            {isMicroStep
              ? "Даже малый шаг лучше остановки. Серия сохранена."
              : "Дисциплина любит факты."}
          </p>
          <SubmitButton isMicroStep={isMicroStep} />
        </div>

        {state.message && (
          <p className={`text-center text-sm px-1 ${state.message.includes('опубликован') ? 'text-[#32D74B]' : 'text-[#FF453A]'}`}>
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}