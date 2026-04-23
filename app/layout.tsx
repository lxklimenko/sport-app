import type { Metadata, Viewport } from "next";
import "./globals.css";

import { BottomNav } from "@/app/bottom-nav";

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
      <body className="min-h-full flex flex-col bg-bg-main text-text-primary overflow-x-hidden">
        <div className="flex-1 flex flex-col pt-[env(safe-area-inset-top)]">
          {children}
        </div>
        <div className="pb-[env(safe-area-inset-bottom)] bg-bg-card border-t border-border-thin">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}