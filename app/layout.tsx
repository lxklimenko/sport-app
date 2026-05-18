import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";

const geist = Geist({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050505",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Discipline — Season Survival",
  description: "Один сезон. Несколько дисциплин. Каждый день решает.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Discipline",
  },
  openGraph: {
    title: "Discipline — Season Survival",
    description: "Выбирай дисциплины. Выживай каждый день. Не дай себя обогнать.",
    url: "https://alex-cosh.ru",
    siteName: "Discipline",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Discipline — Season Survival",
    description: "Выбирай дисциплины. Выживай каждый день.",
  },
  formatDetection: {
    telephone: false,
  },
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
