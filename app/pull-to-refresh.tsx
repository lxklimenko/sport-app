"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef(0);

  const PULL_THRESHOLD = 80;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Только если мы в самом верху страницы
      if (window.scrollY === 0) {
        touchStart.current = e.touches[0].clientY;
      } else {
        touchStart.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStart.current === 0 || isRefreshing) return;

      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStart.current;

      if (distance > 0) {
        // Добавляем "сопротивление" (damping)
        const dampedDistance = Math.pow(distance, 0.8);
        setPullDistance(dampedDistance);

        if (dampedDistance > PULL_THRESHOLD) {
          // Легкая вибрация при достижении порога
          if (pullDistance <= PULL_THRESHOLD) {
            Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
          }
        }

        // Предотвращаем скролл браузера при потягивании вниз
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD);

        try {
          await Haptics.notification({ type: ImpactStyle.Medium }).catch(() => {});
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
      touchStart.current = 0;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen overflow-x-hidden">
      {/* Индикатор обновления */}
      <motion.div
        style={{
          height: isRefreshing ? 60 : pullDistance,
          opacity: pullDistance / PULL_THRESHOLD,
          scale: Math.min(1.2, pullDistance / PULL_THRESHOLD)
        }}
        className="absolute top-0 inset-x-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden"
      >
        <div className="bg-bg-card border border-border-thin rounded-full p-2 shadow-lg">
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: pullDistance * 2 }}
            transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0 }}
          >
            <RefreshCw className={`w-5 h-5 ${pullDistance > PULL_THRESHOLD ? "text-accent" : "text-text-muted"}`} />
          </motion.div>
        </div>
      </motion.div>

      {/* Контент */}
      <motion.div
        animate={{ y: isRefreshing ? 60 : pullDistance }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}