"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { MessageCircle, Trash2 } from "lucide-react";

import { addCommentAction, deleteCommentAction } from "@/app/actions";

type Comment = {
  id: string;
  userId: string;
  authorName: string;
  text: string;
  createdAt: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[#A8C7FA] text-[#062E6F] px-4 rounded-full font-semibold text-xs hover:bg-[#BBD6FE] transition disabled:opacity-50"
    >
      {pending ? "..." : "Отправить"}
    </button>
  );
}

export function CommentsSection({
  postId,
  count,
  comments,
  currentUserId,
}: {
  postId: string;
  count: number;
  comments: Comment[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-[#9AA0A6] hover:text-white transition"
      >
        <MessageCircle className="w-4 h-4" />
        <span>{count}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {comments.length > 0 && (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  <span className="font-semibold shrink-0">{c.authorName}:</span>
                  <span className="flex-1 text-[#C4C7C5]">{c.text}</span>
                  {c.userId === currentUserId && (
                    <form action={deleteCommentAction}>
                      <input type="hidden" name="commentId" value={c.id} />
                      <button
                        type="submit"
                        className="text-[#9AA0A6] hover:text-[#FFB4AB] transition shrink-0"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          <form action={addCommentAction} className="flex gap-2">
            <input type="hidden" name="postId" value={postId} />
            <input
              name="text"
              required
              maxLength={500}
              placeholder="Написать комментарий..."
              className="flex-1 bg-black/30 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#A8C7FA] placeholder-[#9AA0A6]"
            />
            <SubmitButton />
          </form>
        </div>
      )}
    </div>
  );
}
