import type { Metadata, Viewport } from "next";
import "./globals.css";

import { BottomNav } from "@/app/bottom-nav";
import { SplashScreen } from "@/app/splash-screen";
import { GestureProvider } from "@/app/gesture-provider";

export const metadata: Metadata = {
  title: "Discipline",
  description: "Соревновательное веб-приложение для спортсменов и челленджей.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased selection:bg-accent selection:text-black">
      <body className="min-h-full flex flex-col bg-[#f5f5f7] text-text-primary overflow-x-hidden">
        <SplashScreen />
        <GestureProvider />
        <div className="flex-1 flex flex-col pt-[env(safe-area-inset-top)] pb-24">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}