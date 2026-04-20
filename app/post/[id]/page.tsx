import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flame, Reply, Trash2 } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getPool, hasDatabase } from "@/lib/db";
import { getCommentsByPostId } from "@/lib/comments";
import {
  addCommentAction,
  deleteCommentAction,
  deletePostAction,
  toggleLikeAction,
} from "@/app/actions";

export const dynamic = "force-dynamic";

type PostFull = {
  id: string;
  userId: string;
  authorName: string;
  workout: string;
  stats: string;
  imageUrl: string | null;
  createdAt: string;
  likesCount: number;
  likedByMe: boolean;
};

async function getPostById(postId: string, currentUserId: string): Promise<PostFull | null> {
  if (!hasDatabase()) return null;

  const result = await getPool().query<{
    id: string;
    user_id: string;
    author_name: string;
    workout: string;
    stats: string;
    image_url: string | null;
    created_at: Date;
    likes_count: string;
    liked_by_me: boolean;
  }>(
    `SELECT p.id, p.user_id, p.author_name, p.workout, p.stats, p.image_url, p.created_at,
            COALESCE(l.cnt, 0)::text AS likes_count,
            CASE WHEN ml.user_id IS NOT NULL THEN true ELSE false END AS liked_by_me
     FROM posts p
     LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM likes GROUP BY post_id) l ON l.post_id = p.id
     LEFT JOIN likes ml ON ml.post_id = p.id AND ml.user_id = $2
     WHERE p.id = $1
     LIMIT 1`,
    [postId, currentUserId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name,
    workout: row.workout,
    stats: row.stats,
    imageUrl: row.image_url,
    createdAt: row.created_at.toISOString(),
    likesCount: Number(row.likes_count),
    likedByMe: row.liked_by_me,
  };
}

function formatTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

function renderText(text: string) {
  const parts = text.split(/(@[\wа-яА-ЯёЁ]+)/gu);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="text-[#A8C7FA] font-medium">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const post = await getPostById(id, userId);
  if (!post) notFound();

  const comments = await getCommentsByPostId(id);

  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-24">
      <div className="sticky top-0 z-10 bg-[#0D0F12]/90 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link
          href="/profile"
          className="p-2 -ml-2 hover:bg-white/5 rounded-full transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold">Пост</h1>
      </div>

      <div className="mx-auto max-w-2xl">

        <div className="bg-[#1E1F22] mx-4 mt-4 rounded-3xl overflow-hidden">
          <div className="p-5 pb-3">
            <div className="flex justify-between items-center text-sm">
              <Link
                href={`/user/${post.userId}`}
                className="font-semibold hover:text-[#A8C7FA] transition"
              >
                {post.authorName}
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-[#9AA0A6] text-xs">
                  {formatTime(post.createdAt)}
                </span>
                {post.userId === userId && (
                  <form action={deletePostAction}>
                    <input type="hidden" name="postId" value={post.id} />
                    <button
                      type="submit"
                      className="text-[#9AA0A6] hover:text-[#FFB4AB] transition text-xs"
                    >
                      Удалить
                    </button>
                  </form>
                )}
              </div>
            </div>

            <p className="mt-3 text-lg leading-relaxed">{post.workout}</p>
            <p className="mt-1 text-sm text-[#C4C7C5]">{post.stats}</p>
          </div>

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt=""
              className="w-full max-h-[500px] object-cover"
            />
          )}

          <div className="p-5 pt-3 flex gap-5 text-[#9AA0A6]">
            <form action={toggleLikeAction}>
              <input type="hidden" name="postId" value={post.id} />
              <button
                type="submit"
                className={`flex items-center gap-1.5 text-sm transition ${
                  post.likedByMe ? "text-[#FFB4AB]" : "hover:text-white"
                }`}
              >
                <Flame className="w-4 h-4" fill={post.likedByMe ? "currentColor" : "none"} />
                <span>{post.likesCount}</span>
              </button>
            </form>
          </div>
        </div>

        <div className="px-4 mt-6">
          <h2 className="text-sm text-[#9AA0A6] uppercase tracking-widest mb-4">
            Комментарии ({comments.length})
          </h2>

          {comments.length === 0 ? (
            <div className="text-center py-10 text-[#9AA0A6]">
              <p>Пока нет комментариев</p>
              <p className="text-sm mt-1 opacity-70">Будь первым</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1E1F22] shrink-0 flex items-center justify-center text-sm font-semibold">
                    {c.authorName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-[#1E1F22] rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/user/${c.userId}`}
                          className="font-semibold text-sm hover:text-[#A8C7FA] transition"
                        >
                          {c.authorName}
                        </Link>
                        <span className="text-xs text-[#9AA0A6]">
                          {formatTime(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[#E3E3E3]">
                        {renderText(c.text)}
                      </p>
                    </div>
                    <div className="flex gap-4 mt-1 ml-2">
                      <ReplyButton authorName={c.authorName} />
                      {c.userId === userId && (
                        <form action={deleteCommentAction}>
                          <input type="hidden" name="commentId" value={c.id} />
                          <button
                            type="submit"
                            className="text-xs text-[#9AA0A6] hover:text-[#FFB4AB] transition"
                          >
                            Удалить
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CommentForm postId={post.id} />
    </main>
  );
}

function ReplyButton({ authorName }: { authorName: string }) {
  return null;
}

function CommentForm({ postId }: { postId: string }) {
  return (
    <div className="fixed bottom-0 inset-x-0 bg-[#0D0F12]/95 backdrop-blur border-t border-white/5 p-3">
      <div className="mx-auto max-w-2xl">
        <form action={addCommentAction} className="flex gap-2">
          <input type="hidden" name="postId" value={postId} />
          <input
            name="text"
            required
            maxLength={500}
            placeholder="Написать комментарий..."
            className="flex-1 bg-[#1E1F22] rounded-full px-5 py-3 text-sm outline-none focus:ring-1 focus:ring-[#A8C7FA] placeholder-[#9AA0A6]"
          />
          <button
            type="submit"
            className="bg-[#A8C7FA] text-[#062E6F] px-5 rounded-full font-semibold text-sm hover:bg-[#BBD6FE] transition"
          >
            Ответить
          </button>
        </form>
      </div>
    </div>
  );
}