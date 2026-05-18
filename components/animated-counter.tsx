"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  formatter?: (v: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 800,
  className = "",
  suffix = "",
  formatter,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevValue.current;
    const diff = value - start;
    if (diff === 0) return;

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);

      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
        prevValue.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  const displayText = formatter ? formatter(display) : display.toLocaleString("ru");

  return (
    <span className={className}>
      {displayText}{suffix}
    </span>
  );
}
