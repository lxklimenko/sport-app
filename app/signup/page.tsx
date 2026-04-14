import Link from "next/link";
import { ShieldCheck, Trophy, Users, Zap } from "lucide-react";

import { SignupForm } from "@/app/signup/signup-form";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#101113] text-[#F3F5F7]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-8 lg:flex-row lg:items-stretch lg:gap-6">
        <section className="flex flex-1 flex-col justify-between rounded-[2rem] bg-[linear-gradient(135deg,#C4EEDB_0%,#A8C7FA_55%,#FDE293_100%)] p-8 text-[#082032] shadow-2xl lg:p-10">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/55 px-4 py-2 text-sm font-semibold backdrop-blur"
            >
              <Zap className="h-4 w-4" />
              Discipline
            </Link>

            <h1 className="mt-10 max-w-xl text-4xl font-semibold leading-tight lg:text-6xl">
              Войди в клуб, где результат видно каждый день.
            </h1>

            <p className="mt-6 max-w-lg text-lg text-[#15364D]/90">
              Регистрация открывает доступ к шаговым челленджам, спортивной
              ленте, батлам один на один и призовым соревнованиям.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white/50 p-4 backdrop-blur">
              <Trophy className="h-6 w-6" />
              <div className="mt-4 text-2xl font-semibold">1000 ₽</div>
              <p className="mt-1 text-sm text-[#15364D]/80">
                приз победителю месяца
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/50 p-4 backdrop-blur">
              <Users className="h-6 w-6" />
              <div className="mt-4 text-2xl font-semibold">120</div>
              <p className="mt-1 text-sm text-[#15364D]/80">
                спортсменов уже в сезоне
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/50 p-4 backdrop-blur">
              <ShieldCheck className="h-6 w-6" />
              <div className="mt-4 text-2xl font-semibold">7/7</div>
              <p className="mt-1 text-sm text-[#15364D]/80">
                дней нужна дисциплина
              </p>
            </div>
          </div>
        </section>

        <section className="w-full rounded-[2rem] border border-white/10 bg-[#181A1E] p-6 shadow-2xl lg:max-w-xl lg:p-8">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.28em] text-[#9AA0A6]">
              Регистрация
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              Создай спортивный профиль
            </h2>
            <p className="mt-3 text-[#C4C7C5]">
              После регистрации аккаунт сохранится на сервере, откроется сессия,
              и пользователь сразу попадет в личный кабинет.
            </p>
          </div>

          <SignupForm />
        </section>
      </div>
    </main>
  );
}
