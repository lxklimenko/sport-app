"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flame, User, Users, Send, Bell } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const hideOn = ["/login", "/signup"];
  if (hideOn.includes(pathname)) return null;

  const items = [
    { href: "/", icon: Home, label: "Главная" },
    { href: "/feed", icon: Flame, label: "Лента" },
    { href: "/messages", icon: Send, label: "Чат" },
    { href: "/notifications", icon: Bell, label: "Уведомления" },
    { href: "/profile", icon: User, label: "Профиль" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0D0F12]/95 backdrop-blur border-t border-white/5">
      <div className="mx-auto max-w-2xl flex">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 transition ${
                isActive ? "text-white" : "text-[#9AA0A6]"
              }`}
            >
              <Icon
                className="w-6 h-6"
                fill={isActive ? "currentColor" : "none"}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}