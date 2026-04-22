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
    // Применяем премиальный класс glass-panel из нашего обновленного globals.css
    <nav className="fixed bottom-0 inset-x-0 z-50 glass-panel pb-safe">
      <div className="mx-auto max-w-2xl flex items-center justify-around px-2 py-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1 flex flex-col items-center py-2 group active-scale"
            >
              <div className="relative flex items-center justify-center transition-all duration-300">
                <Icon
                  className={`w-6 h-6 transition-colors duration-300 ${
                    isActive
                      ? "text-accent" // Яркий Apple Fitness Green
                      : "text-text-muted group-hover:text-text-secondary"
                  }`}
                  // В iOS 17 активные иконки Tab Bar часто залиты цветом
                  fill={isActive ? "currentColor" : "none"}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                
                {/* Невидимая магия: крошечный блик под активной иконкой для глубины */}
                {isActive && (
                  <div className="absolute -bottom-4 w-1 h-1 rounded-full bg-accent opacity-50 blur-[2px]" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-wide transition-colors duration-300 ${
                isActive
                  ? "text-accent font-semibold"
                  : "text-text-muted font-medium"
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