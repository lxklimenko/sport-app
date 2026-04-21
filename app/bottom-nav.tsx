"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flame, User, Users, Shield } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const hideOn = ["/login", "/signup"];
  if (hideOn.includes(pathname)) return null;

  const items = [
    { href: "/", icon: Home, label: "Главная" },
    { href: "/feed", icon: Flame, label: "Лента" },
    { href: "/teams", icon: Shield, label: "Команды" },
    { href: "/users", icon: Users, label: "Люди" },
    { href: "/profile", icon: User, label: "Профиль" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#10121A]/95 backdrop-blur-xl border-t border-white/5">
      <div className="mx-auto max-w-2xl flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1 flex flex-col items-center py-1.5 group"
            >
              <div className={`relative flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? "px-5 py-1.5 rounded-full bg-gradient-to-br from-[#B4A5FF]/20 to-[#8E7AE0]/20 border border-[#B4A5FF]/30"
                  : "p-1.5"
              }`}>
                <Icon
                  className={`w-5 h-5 transition-all ${
                    isActive
                      ? "text-[#B4A5FF]"
                      : "text-[#8F8D9C] group-hover:text-[#C8C6D4]"
                  }`}
                  fill={isActive ? "currentColor" : "none"}
                  strokeWidth={isActive ? 2 : 1.75}
                />
              </div>
              <span className={`text-[9px] mt-0.5 transition-all ${
                isActive
                  ? "text-[#B4A5FF] font-semibold"
                  : "text-[#8F8D9C]"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}