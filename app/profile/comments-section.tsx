import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function CommentsSection({
  postId,
  count,
}: {
  postId: string;
  count: number;
}) {
  return (
    <Link
      href={`/post/${postId}`}
      className="inline-flex items-center gap-1.5 p-1 -ml-1 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary transition-colors active-scale group"
    >
      {/* Иконка чуть крупнее для удобного тапа, цвет меняется при наведении */}
      <MessageCircle className="w-5 h-5 transition-colors" />
      <span>{count}</span>
    </Link>
  );
}