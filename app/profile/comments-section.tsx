"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { MessageCircle, Trash2, Reply } from "lucide-react";

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

function renderTextWithMentions(text: string) {
  const parts = text.split(/(@[\wа-яА-ЯёЁ]+)/gu);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-[#A8C7FA] font-medium">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleReply = (authorName: string) => {
    if (!inputRef.current) return;
    const currentValue = inputRef.current.value;
    const mention = `@${authorName.replace(/\s+/g, "_")} `;

    if (!currentValue.includes(mention)) {
      inputRef.current.value = mention + currentValue;
    }
    inputRef.current.focus();
  };

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
                <div key={c.id} className="flex items-start gap-2 text-sm group">
                  <div className="flex-1">
                    <span className="font-semibold">{c.authorName}:</span>{" "}
                    <span className="text-[#C4C7C5]">
                      {renderTextWithMentions(c.text)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReply(c.authorName)}
                    className="text-[#9AA0A6] hover:text-white transition shrink-0 md:opacity-0 md:group-hover:opacity-100"
                    title="Ответить"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>

                  {c.userId === currentUserId && (
                    <form action={deleteCommentAction}>
                      <input type="hidden" name="commentId" value={c.id} />
                      <button
                        type="submit"
                        className="text-[#9AA0A6] hover:text-[#FFB4AB] transition shrink-0 md:opacity-0 md:group-hover:opacity-100"
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
              ref={inputRef}
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