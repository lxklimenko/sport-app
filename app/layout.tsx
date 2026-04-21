import type { Metadata } from "next";
import "./globals.css";

import { BottomNav } from "@/app/bottom-nav";

export const metadata: Metadata = {
  title: "Discipline",
  description: "Соревновательное веб-приложение для спортсменов и челленджей.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div className="flex-1">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}