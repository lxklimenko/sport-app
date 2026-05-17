"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { EventVictoryMoment } from "./event-victory-moment";
import { EventEndingCeremony } from "./event-ending-ceremony";

interface Theme {
  bg: string;
  glow: string;
  accent: string;
  accentText: string;
  border: string;
  dot: string;
  live: string;
}

interface TopEntry {
  name: string;
  value: number;
  rank: number;
}

type VictoryType = "top10" | "target_done" | "survived_day";

export function EventMoments({
  isLive,
  isUpcoming,
  joined,
  userRank,
  userValue,
  dailyTarget,
  top3,
  participantCount,
  aliveCount,
  eliminatedCount,
  title,
  emoji,
  theme,
}: {
  isLive: boolean;
  isUpcoming: boolean;
  joined: boolean;
  userRank: number | null;
  userValue: number;
  dailyTarget: number;
  top3: TopEntry[];
  participantCount: number;
  aliveCount: number;
  eliminatedCount: number;
  title: string;
  emoji: string | null;
  theme: Theme;
}) {
  const router = useRouter();
  const [victory, setVictory] = useState<VictoryType | null>(null);
  const [showEnding, setShowEnding] = useState(false);
  const prevRank = useRef(userRank);
  const prevValue = useRef(userValue);

  // Victory: entered TOP 10
  useEffect(() => {
    if (!joined || !userRank) return;
    const prev = prevRank.current;
    if (prev && prev > 10 && userRank <= 10) {
      setVictory("top10");
    }
    prevRank.current = userRank;
  }, [joined, userRank]);

  // Victory: target done
  useEffect(() => {
    if (!joined || dailyTarget <= 0) return;
    const prev = prevValue.current;
    if (prev < dailyTarget && userValue >= dailyTarget) {
      setVictory("target_done");
    }
    prevValue.current = userValue;
  }, [joined, userValue, dailyTarget]);

  // Ending ceremony: event just ended
  useEffect(() => {
    if (!isUpcoming && !isLive && joined) {
      const shown = sessionStorage.getItem(`event_ending_${title}`);
      if (!shown) {
        setShowEnding(true);
        sessionStorage.setItem(`event_ending_${title}`, "1");
      }
    }
  }, [isLive, isUpcoming, joined, title]);

  return (
    <>
      {victory && (
        <EventVictoryMoment
          type={victory}
          rank={userRank}
          theme={theme}
          onDone={() => {
            setVictory(null);
            router.refresh();
          }}
        />
      )}

      {showEnding && (
        <EventEndingCeremony
          title={title}
          emoji={emoji}
          top3={top3}
          participantCount={participantCount}
          aliveCount={aliveCount}
          eliminatedCount={eliminatedCount}
          userRank={userRank}
          userValue={userValue}
          theme={theme}
          onDone={() => {
            setShowEnding(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
