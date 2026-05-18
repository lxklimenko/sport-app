import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Discipline — Season Survival",
  description: "Один сезон. Несколько дисциплин. Каждый день решает.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${geist.className} h-full antialiased`}>
      <body className="min-h-dvh bg-[#050505] text-white">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
