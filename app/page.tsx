"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ChevronRight,
  Zap,
  Flame,
  ArrowRight,
  Sun,
} from "lucide-react";

export default function Home() {
  const [liveSteps, setLiveSteps] = useState(12430);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSteps((prev) => prev + Math.floor(Math.random() * 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#131314] text-[#E3E3E3] font-sans pb-20">

      {/* NAV */}
      <nav className="fixed top-4 inset-x-0 mx-auto w-[calc(100%-2rem)] max-w-7xl bg-[#1E1F22] rounded-full px-4 py-3 flex items-center justify-between z-50 shadow-lg">
        <div className="flex items-center gap-3 pl-2">
          <div className="w-8 h-8 rounded-full bg-[#A8C7FA] flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#062E6F]" fill="currentColor" />
          </div>
          <span className="font-medium text-lg">Discipline</span>
        </div>

        <Link
          href="/login"
          className="px-6 py-2 rounded-full bg-[#333537] hover:bg-[#444746] transition"
        >
          Войти
        </Link>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto">

        <div className="flex items-center gap-3 mb-10 text-[#C4C7C5] text-lg">
          <Sun className="w-6 h-6 text-[#FDE293]" fill="currentColor" />
          <span>Сегодня • {liveSteps.toLocaleString()} шагов</span>
        </div>

        <h1 className="text-6xl md:text-8xl leading-tight mb-8 text-[#F2F2F2]">
          Стань первым.<br />Каждый день.
        </h1>

        <p className="text-xl text-[#C4C7C5] mb-12 max-w-xl">
          Твоя дисциплина. Твой результат. Выбирай челлендж и докажи, что ты готов к победе.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="px-8 py-5 bg-[#A8C7FA] text-[#062E6F] rounded-full flex items-center gap-3 text-lg hover:bg-[#BBD6FE] transition"
          >
            Выбрать челлендж
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="px-6 py-4 border border-[#444746] rounded-full">
            Сезон Q1
          </div>
        </div>
      </section>

      {/* CHALLENGES */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl mb-10">Челленджи</h2>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Главный */}
          <div className="md:col-span-2 p-10 rounded-[2rem] bg-[#C4EEDB] text-[#003829] flex flex-col justify-between hover:bg-[#D5F5E4] transition cursor-pointer">
            <div>
              <div className="mb-6 px-4 py-2 bg-[#003829]/10 rounded-full text-sm font-bold w-fit">
                Активен сейчас
              </div>

              <h3 className="text-4xl mb-4">Step Challenge</h3>
              <p className="text-lg opacity-80">
                30 дней непрерывного движения
              </p>
            </div>

            <div className="flex justify-between items-end mt-10">
              <div>
                <div className="text-3xl">120</div>
                <div className="text-sm opacity-70">участников</div>
              </div>

              <div className="w-14 h-14 rounded-full bg-[#003829] text-white flex items-center justify-center">
                <ChevronRight />
              </div>
            </div>
          </div>

          {/* Малые карточки */}
          <div className="p-8 rounded-[2rem] bg-[#1E1F22] hover:bg-[#282A2D] transition">
            <div className="w-12 h-12 bg-[#F2B8B5] text-[#601410] rounded-full flex items-center justify-center mb-6">
              <Flame />
            </div>
            <h3 className="text-xl mb-2">Турнир</h3>
            <p className="text-[#C4C7C5]">Скоро</p>
          </div>

          <div className="p-8 rounded-[2rem] bg-[#1E1F22] hover:bg-[#282A2D] transition">
            <div className="w-12 h-12 bg-[#E0E2E1] text-black rounded-full flex items-center justify-center mb-6">
              <Zap />
            </div>
            <h3 className="text-xl mb-2">Non-zero</h3>
            <p className="text-[#C4C7C5]">Каждый день</p>
          </div>

        </div>
      </section>

      {/* LEADERBOARD */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <h2 className="text-3xl mb-10">Зал славы</h2>

        <div className="flex flex-col gap-3">

          <div className="p-4 rounded-full bg-[#FDE293] text-black flex justify-between items-center">
            <span>🥇 Iron_Will</span>
            <span>345,920</span>
          </div>

          <div className="p-4 rounded-full bg-[#1E1F22] flex justify-between">
            <span>🥈 Alex</span>
            <span>312,400</span>
          </div>

          <div className="p-4 rounded-full bg-[#1E1F22] flex justify-between">
            <span>🥉 Mike</span>
            <span>298,100</span>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="py-20 flex justify-center">
        <Link
          href="/signup"
          className="px-12 py-6 bg-[#C4EEDB] text-black rounded-full flex items-center gap-4 hover:bg-[#D5F5E4] transition"
        >
          Начать
          <ArrowRight />
        </Link>
      </section>

    </div>
  );
}
