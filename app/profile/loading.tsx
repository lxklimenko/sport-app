import React from "react";

export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-bg-main text-text-primary pb-24">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 glass-panel px-4 py-2 flex items-center justify-between min-h-[60px]">
        <div className="w-11 h-11 rounded-full shimmer" />
        <div className="w-32 h-4 rounded shimmer" />
        <div className="w-11 h-11 rounded-full shimmer" />
      </div>

      <div className="px-5 pt-6">
        {/* Avatar & Stats Skeleton */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full shimmer" />
          <div className="flex-1 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="w-full h-8 rounded shimmer" />
                <div className="w-full h-3 rounded shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Info Skeleton */}
        <div className="mb-6 space-y-2">
          <div className="w-40 h-6 rounded shimmer" />
          <div className="w-60 h-4 rounded shimmer" />
        </div>

        {/* Buttons Skeleton */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-10 rounded-xl shimmer" />
          <div className="flex-1 h-10 rounded-xl shimmer" />
          <div className="flex-1 h-10 rounded-xl shimmer" />
        </div>

        {/* Challenges Skeleton */}
        <div className="mb-8 space-y-4">
          <div className="w-40 h-4 rounded shimmer" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-28 rounded-[1.5rem] shimmer" />
            <div className="h-28 rounded-[1.5rem] shimmer" />
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-3 gap-[2px]">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square shimmer" />
        ))}
      </div>
    </main>
  );
}