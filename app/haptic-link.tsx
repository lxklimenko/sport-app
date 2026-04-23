"use client";

import Link from "next/link";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface HapticLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export function HapticLink({ href, className, children }: HapticLinkProps) {
  const handleClick = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Игнорируем в браузере
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}