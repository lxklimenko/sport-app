"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", icon: "🏠", label: "Мир" },
  { href: "/season/current", icon: "⚔️", label: "Сезон" },
  { href: "/pulse", icon: "📡", label: "Пульс" },
  { href: "/profile", icon: "👤", label: "Ты" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // Don't show on auth pages, onboarding, events detail
  const hiddenPaths = ["/login", "/signup", "/onboarding", "/record"];
  const isHidden = hiddenPaths.some((p) => pathname === p || pathname.startsWith("/events/"));

  if (isHidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom-sm">
      {/* Glass background */}
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-[28px] border border-white/[0.06] bg-[#0B0B0C]/90 backdrop-blur-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.5)] px-3 py-2">
          <div className="flex items-center justify-around">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200",
                    isActive
                      ? "text-white"
                      : "text-white/30 hover:text-white/60",
                  ].join(" ")}
                >
                  {/* Active glow */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-white/[0.06] border border-white/[0.06]" />
                  )}
                  <span className="relative text-[20px] leading-none">{item.icon}</span>
                  <span className={[
                    "relative text-[9px] font-medium uppercase tracking-[0.12em] transition-colors",
                    isActive ? "text-white/80" : "text-white/30",
                  ].join(" ")}>
                    {item.label}
                  </span>
                  {/* Active dot */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
