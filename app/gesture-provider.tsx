"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const ROOT_PAGES = ["/", "/feed", "/teams", "/users", "/profile"];
const EDGE_ZONE = 28;
const BACK_THRESHOLD = 90;
const VELOCITY_THRESHOLD = 0.4;

export function GestureProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const trackingEdge = useRef(false);
  const lastTime = useRef(0);
  const lastX = useRef(0);

  const isRoot = ROOT_PAGES.includes(pathname);

  useEffect(() => {
    if (isRoot) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartX.current = t.clientX;
      touchStartY.current = t.clientY;
      lastX.current = t.clientX;
      lastTime.current = Date.now();
      trackingEdge.current = t.clientX <= EDGE_ZONE;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!trackingEdge.current) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX.current;
      const dy = Math.abs(t.clientY - touchStartY.current);

      if (dx > 10 && dy < dx * 0.6) {
        const el = document.getElementById("gesture-page");
        if (el) {
          const clamped = Math.min(dx * 0.6, 160);
          el.style.transform = `translateX(${clamped}px)`;
          el.style.opacity = String(1 - clamped / 400);
        }
      }
      lastX.current = t.clientX;
      lastTime.current = Date.now();
    };

    const onTouchEnd = async (e: TouchEvent) => {
      const el = document.getElementById("gesture-page");

      if (!trackingEdge.current) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX.current;
      const dt = Date.now() - lastTime.current;
      const velocity = dt > 0 ? (t.clientX - lastX.current) / dt : 0;
      const dy = Math.abs(t.clientY - touchStartY.current);

      const shouldGoBack =
        dy < dx * 0.6 &&
        (dx > BACK_THRESHOLD || velocity > VELOCITY_THRESHOLD);

      if (el) {
        if (shouldGoBack) {
          el.style.transition = "transform 0.22s cubic-bezier(0.32,0.72,0,1), opacity 0.22s ease";
          el.style.transform = "translateX(100%)";
          el.style.opacity = "0";
          await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
          setTimeout(() => router.back(), 180);
        } else {
          el.style.transition = "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease";
          el.style.transform = "translateX(0)";
          el.style.opacity = "1";
          setTimeout(() => {
            el.style.transition = "";
          }, 350);
        }
      }

      trackingEdge.current = false;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isRoot, router]);

  return null;
}
