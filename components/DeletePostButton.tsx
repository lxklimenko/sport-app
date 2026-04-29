"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { deletePostAction } from "@/app/actions";

export function DeletePostButton({ postId }: { postId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    setShowConfirm(false);
    const formData = new FormData();
    formData.append("postId", postId);
    deletePostAction(formData);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="text-[#9AA0A6] hover:text-[#FFB4AB] transition text-xs flex items-center gap-1"
      >
        <Trash2 className="w-4 h-4" />
        Удалить
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Удалить пост?</h3>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5 text-[#98989E]" />
              </button>
            </div>
            <p className="text-[#98989E] text-sm mb-6">
              Это действие нельзя отменить. Пост и все его данные будут удалены безвозвратно.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition active:scale-95"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-[#FF453A] text-white font-semibold text-sm hover:bg-[#FF5B52] transition active:scale-95"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}