import { redirect } from "next/navigation";
import Link from "next/link";
import { KeyRound, Trophy, Users, Zap } from "lucide-react";

import { LoginForm } from "@/app/login/login-form";
import { getSessionUserId } from "@/lib/auth";

export default async function LoginPage() {
  const userId = await getSessionUserId();

  if (userId) {
    redirect("/profile");
  }

  return (
    <main className="min-h-screen bg-[#101113] text-[#F3F5F7]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-8 lg:flex-row lg:items-stretch lg:gap-6">
        <section className="flex flex-1 flex-col justify-between rounded-[2rem] bg-[linear-gradient(135deg,#A8C7FA_0%,#C4EEDB_52%,#FDE293_100%)] p-8 text-[#082032] shadow-2xl lg:p-10">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/55 px-4 py-2 text-sm font-semibold backdrop-blur"
            >
              <Zap className="h-4 w-4" />
              Discipline
            </Link>

            <h1 className="mt-10 max-w-xl text-4xl font-semibold leading-tight lg:text-6xl">
              Возвращайся в сезон и продолжай гонку.
            </h1>

            <p className="mt-6 max-w-lg text-lg text-[#15364D]/90">
              Вход нужен, чтобы пользователь мог вернуться в свой профиль,
              рейтинг, батлы и тренировочную ленту без новой регистрации.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white/50 p-4 backdrop-blur">
              <KeyRound className="h-6 w-6" />
              <div className="mt-4 text-2xl font-semibold">1 аккаунт</div>
              <p className="mt-1 text-sm text-[#15364D]/80">
                один профиль на весь сезон
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/50 p-4 backdrop-blur">
              <Trophy className="h-6 w-6" />
              <div className="mt-4 text-2xl font-semibold">Челленджи</div>
              <p className="mt-1 text-sm text-[#15364D]/80">
                твой прогресс и место в рейтинге
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/50 p-4 backdrop-blur">
              <Users className="h-6 w-6" />
              <div className="mt-4 text-2xl font-semibold">Лента</div>
              <p className="mt-1 text-sm text-[#15364D]/80">
                посты, фото и батлы с другими
              </p>
            </div>
          </div>
        </section>

        <section className="w-full rounded-[2rem] border border-white/10 bg-[#181A1E] p-6 shadow-2xl lg:max-w-xl lg:p-8">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.28em] text-[#9AA0A6]">
              Вход
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Открой свой профиль</h2>
            <p className="mt-3 text-[#C4C7C5]">
              Введи email и пароль, чтобы вернуться в личный кабинет.
            </p>
          </div>

          <LoginForm />
        </section>
      </div>
    </main>
  );
}
