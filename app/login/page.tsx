import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session.userId) redirect("/profile");

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link
            href="/"
            className="touch-card text-[11px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors"
          >
            ← Discipline
          </Link>
          <h1 className="mt-6 text-[32px] font-semibold tracking-tight leading-tight">
            Вернись в игру
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Сезон идёт. Твоё место ждёт.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-sm text-white/30 text-center">
          Нет аккаунта?{" "}
          <Link
            href="/signup"
            className="touch-card text-white/60 underline underline-offset-4 hover:text-white transition-colors"
          >
            Создать профиль
          </Link>
        </p>
      </div>
    </main>
  );
}
