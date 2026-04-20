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
      className="flex items-center gap-1.5 text-sm text-[#9AA0A6] hover:text-white transition"
    >
      <MessageCircle className="w-4 h-4" />
      <span>{count}</span>
    </Link>
  );
}