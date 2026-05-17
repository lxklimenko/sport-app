/**
 * Skeleton components for loading states.
 * Used by season/current, events/[slug], profile.
 */

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-[22px] border border-white/[0.06] bg-white/[0.025] overflow-hidden ${className}`}>
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-3 w-24 rounded-full bg-white/[0.06]" />
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="h-3 w-32 rounded-full bg-white/[0.04]" />
        <div className="h-2 w-full rounded-full bg-white/[0.04]" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 rounded-xl bg-white/[0.04]" />
          <div className="h-14 rounded-xl bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.018] overflow-hidden animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
          <div className="w-6 h-6 rounded-lg bg-white/[0.06]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 rounded-full bg-white/[0.06]" />
            <div className="h-2.5 w-20 rounded-full bg-white/[0.04]" />
          </div>
          <div className="h-4 w-16 rounded-lg bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonHero({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-6 ${className}`}>
      <div className="space-y-4 animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.06] mx-auto" />
        <div className="h-8 w-48 rounded-lg bg-white/[0.06] mx-auto" />
        <div className="h-3 w-32 rounded-full bg-white/[0.04] mx-auto" />
        <div className="flex items-center justify-center gap-4">
          <div className="h-3 w-16 rounded-full bg-white/[0.04]" />
          <div className="h-3 w-16 rounded-full bg-white/[0.04]" />
          <div className="h-3 w-16 rounded-full bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

export function SeasonCurrentSkeleton() {
  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-4 w-24 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] animate-pulse" />
        </div>

        {/* Hero */}
        <div className="mb-6">
          <div className="h-3 w-32 rounded-full bg-white/[0.06] animate-pulse mb-3" />
          <div className="h-12 w-56 rounded-lg bg-white/[0.06] animate-pulse mb-2" />
          <div className="h-3 w-40 rounded-full bg-white/[0.04] animate-pulse" />
        </div>

        {/* Discipline tabs */}
        <div className="flex gap-2 mb-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 flex-1 rounded-xl bg-white/[0.06] animate-pulse" />
          ))}
        </div>

        {/* Stats block */}
        <SkeletonBlock className="mb-5" />

        {/* Leaderboard */}
        <div className="mb-2">
          <div className="h-3 w-32 rounded-full bg-white/[0.06] animate-pulse" />
        </div>
        <SkeletonList rows={8} />
      </div>
    </main>
  );
}

export function EventSkeleton() {
  return (
    <main className="min-h-screen bg-[#0a0606] text-white">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        {/* Sticky badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-8 h-8 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="h-6 w-28 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="w-8" />
        </div>

        {/* Hero */}
        <SkeletonHero className="mb-6" />

        {/* Status */}
        <SkeletonBlock className="mb-5" />

        {/* Leaderboard */}
        <div className="mb-2">
          <div className="h-3 w-32 rounded-full bg-white/[0.06] animate-pulse" />
        </div>
        <SkeletonList rows={6} />
      </div>
    </main>
  );
}

export function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="max-w-md mx-auto px-5 pt-6 pb-20">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-4 w-24 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] animate-pulse" />
        </div>

        {/* Identity */}
        <div className="flex items-center gap-3.5 mb-7">
          <div className="w-14 h-14 rounded-[18px] bg-white/[0.06] animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-36 rounded-lg bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-24 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4 mb-5 animate-pulse">
          <div className="h-3 w-24 rounded-full bg-white/[0.06] mb-3" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="w-8 h-8 rounded-xl bg-white/[0.06] mx-auto mb-1.5" />
                <div className="h-5 w-12 rounded-lg bg-white/[0.06] mx-auto mb-1" />
                <div className="h-2.5 w-16 rounded-full bg-white/[0.04] mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Hero */}
        <div className="mb-7 animate-pulse">
          <div className="h-3 w-32 rounded-full bg-white/[0.06] mb-2" />
          <div className="h-12 w-48 rounded-lg bg-white/[0.06] mb-2" />
          <div className="h-3 w-36 rounded-full bg-white/[0.04]" />
        </div>

        {/* Disciplines */}
        <SkeletonBlock className="mb-5" />
      </div>
    </main>
  );
}
