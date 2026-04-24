"use client";

import { useRouter } from "next/navigation";
import { PullToRefresh } from "@/app/pull-to-refresh";

export function FeedClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleRefresh = async () => {
    return new Promise<void>((resolve) => {
      router.refresh();
      // Искусственная задержка для плавности анимации
      setTimeout(resolve, 800);
    });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {children}
    </PullToRefresh>
  );
}