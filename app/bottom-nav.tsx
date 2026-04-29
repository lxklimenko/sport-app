"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Rss, User, Users, Trophy } from "lucide-react";
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function BottomNav() {
  const pathname = usePathname();

  const handleImpact = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Игнорируем в браузере
    }
  };

  const hideOn = ["/login", "/signup"];
  if (hideOn.includes(pathname)) return null;

  const items = [
    { href: "/", icon: Home, label: "Главная" },
    { href: "/feed", icon: Rss, label: "Лента" },
    { href: "/teams", icon: Trophy, label: "Команды" },
    { href: "/users", icon: Users, label: "Люди" },
    { href: "/profile", icon: User, label: "Профиль" },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 glass mx-auto max-w-lg flex items-center justify-around px-2 py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleImpact}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all active:scale-95 ${
              isActive
                ? "text-accent"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <Icon
              size={24}
              strokeWidth={isActive ? 2.5 : 1.5}
              fill="none"
            />
            <span className="text-[10px] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}