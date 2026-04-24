import React from "react";

export default function FeedLoading() {
  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-20">
      <div className="sticky top-0 z-50 bg-[#1C1C1E]/70 backdrop-blur-2xl border-b border-white/5 px-5 py-3 flex items-center justify-between">
        <div className="w-24 h-8 rounded-full shimmer" />
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-full shimmer" />
          <div className="w-10 h-10 rounded-full shimmer" />
        </div>
      </div>

      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="w-20 h-5 rounded shimmer" />
        <div className="w-16 h-4 rounded shimmer" />
      </div>

      <div className="mx-auto max-w-2xl px-4 space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1E1F22] rounded-3xl overflow-hidden border border-white/5">
            <div className="p-5 pb-3">
              <div className="flex justify-between items-center">
                <div className="w-32 h-4 rounded shimmer" />
                <div className="w-20 h-3 rounded shimmer" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="w-full h-4 rounded shimmer" />
                <div className="w-3/4 h-4 rounded shimmer" />
              </div>
              <div className="mt-3 w-40 h-3 rounded shimmer" />
            </div>
            <div className="aspect-[4/3] w-full shimmer" />
            <div className="p-5 pt-3 flex gap-5">
              <div className="w-12 h-5 rounded shimmer" />
              <div className="w-12 h-5 rounded shimmer" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}