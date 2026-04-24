"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Flame, MessageCircle, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { toggleLikeAction } from "@/app/actions";

interface PostProps {
  post: any;
  commentsCount: number;
}

export function FeedPost({ post, commentsCount }: PostProps) {
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef<number>(0);

  const formatTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.max(1, Math.floor(diffMs / 60000));
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    const days = Math.floor(hours / 24);
    return `${days} дн назад`;
  };

  const handleDoubleTap = async (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Это двойной тап!
      if (!post.likedByMe) {
        // Лайкаем только если еще не лайкнуто
        const formData = new FormData();
        formData.append("postId", post.id);
        await toggleLikeAction(formData);
      }

      // Визуальный эффект
      setShowHeart(true);

      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (e) {}

      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap.current = now;
  };

  return (
    <div className="bg-[#1E1F22] rounded-3xl overflow-hidden border border-white/5">
      <div className="p-5 pb-3">
        <div className="flex justify-between items-center text-sm">
          <Link
            href={`/user/${post.userId}`}
            className="font-semibold hover:text-[#A8C7FA] transition active:opacity-60"
          >
            {post.authorName}
          </Link>
          <span className="text-[#9AA0A6] text-xs">
            {formatTime(post.createdAt)}
          </span>
        </div>

        <p className="mt-3 text-lg leading-relaxed">{post.workout}</p>
        <p className="mt-1 text-sm text-[#C4C7C5]">{post.stats}</p>
      </div>

      {post.imageUrl && (
        <div
          className="relative overflow-hidden cursor-pointer select-none"
          onClick={handleDoubleTap}
        >
          <img
            src={post.imageUrl}
            alt=""
            className="w-full max-h-[500px] object-cover pointer-events-none"
          />

          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "backOut" }}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="p-5 pt-3 flex gap-5 text-[#9AA0A6]">
        <form action={toggleLikeAction}>
          <input type="hidden" name="postId" value={post.id} />
          <button
            type="submit"
            onClick={() => Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})}
            className={`flex items-center gap-1.5 text-sm transition active:scale-90 ${
              post.likedByMe ? "text-[#FF453A]" : "hover:text-white"
            }`}
          >
            <Flame
              className="w-5 h-5"
              fill={post.likedByMe ? "currentColor" : "none"}
            />
            <span className={post.likedByMe ? "font-bold text-white" : ""}>{post.likesCount}</span>
          </button>
        </form>

        <Link
          href={`/post/${post.id}`}
          className="flex items-center gap-1.5 text-sm hover:text-white transition active:scale-90"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{commentsCount}</span>
        </Link>
      </div>
    </div>
  );
}