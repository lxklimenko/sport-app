import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Clock3,
  Flame,
  Footprints,
  Medal,
  MessageCircle,
  Swords,
  Trophy,
  Wallet,
} from "lucide-react";

import { logout } from "@/app/actions/auth";
import { getSessionUserId } from "@/lib/auth";
import { getRecentPosts } from "@/lib/posts";
import { getUserById, getUsersCount } from "@/lib/users";
import { PostComposer } from "@/app/profile/post-composer";

const battles = [
  {
    title: "Батл на шаги",
    stake: "Вход 100 ₽",
    reward: "Победитель забирает 150 ₽",
    rival: "против Iron_Will",
  },
  {
    title: "Функциональный спринт",
    stake: "Вход 100 ₽",
    reward: "Победитель забирает 150 ₽",
    rival: "против Max Power",
  },
];

export default async function ProfilePage() {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/signup");
  }

  const user = await getUserById(userId);
  if (!user) {
    redirect("/signup");
  }

  const usersCount = await getUsersCount();
  const posts = await getRecentPosts();
  const placement = user.number === 1 ? "#1" : `#${Math.min(user.number + 11, 99)}`;
  const monthlySteps = 248430 + user.number * 20000;
  const prizeBank = 1000 + usersCount * 350;

  return (
    <main className="min-h-screen bg-[#0D0F12] px-6 py-6 text-[#F5F7FA]">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,#1A3A33_0%,#12161B_50%,#0D0F12_100%)] p-6 shadow-2xl lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#9CD9BD]">
                Личный профиль
              </p>
              <h1 className="mt-3 text-4xl font-semibold lg:text-6xl">
                {user.name}, ты {user.number === 1 ? "первый участник проекта." : "уже внутри сезона."}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-[#C5D0D8]">
                Здесь виден твой реальный аккаунт: можно вступать в челленджи,
                выкладывать тренировки в ленту и принимать батлы от других
                спортсменов. Сейчас твой любимый формат: {user.favoriteFormat}.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-[#9AA0A6]">Место</div>
                <div className="mt-2 text-3xl font-semibold">{placement}</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-[#9AA0A6]">Шаги за месяц</div>
                <div className="mt-2 text-3xl font-semibold">
                  {monthlySteps.toLocaleString("ru-RU")}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-[#9AA0A6]">Банк призов</div>
                <div className="mt-2 text-3xl font-semibold">
                  {prizeBank.toLocaleString("ru-RU")} ₽
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-[1.8rem] bg-[#171A1F] p-5">
                <div className="flex items-center gap-3 text-[#A8C7FA]">
                  <Footprints className="h-5 w-5" />
                  <span className="text-sm">Главный челлендж</span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold">Шаги апреля</h2>
                <p className="mt-2 text-[#C4C7C5]">
                  Осталось 17 дней. {user.number === 1
                    ? "Ты первый зарегистрированный участник и уже задаешь темп."
                    : "До следующей позиции в рейтинге не хватает совсем немного."}
                </p>
                <div className="mt-6 h-3 rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-[#A8C7FA]"
                    style={{ width: `${Math.min(92, 55 + user.number * 8)}%` }}
                  />
                </div>
              </article>

              <article className="rounded-[1.8rem] bg-[#171A1F] p-5">
                <div className="flex items-center gap-3 text-[#FDE293]">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm">Приз месяца</span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold">1 000 ₽</h2>
                <p className="mt-2 text-[#C4C7C5]">
                  Победитель по шагам получает денежный приз и бейдж легенды.
                </p>
              </article>

              <article className="rounded-[1.8rem] bg-[#171A1F] p-5">
                <div className="flex items-center gap-3 text-[#C4EEDB]">
                  <Flame className="h-5 w-5" />
                  <span className="text-sm">Серия дисциплины</span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold">16 дней</h2>
                <p className="mt-2 text-[#C4C7C5]">
                  Ни одного пропуска тренировок. Еще 5 дней до нового бейджа.
                </p>
              </article>
            </div>

            <section className="rounded-[2rem] bg-[#171A1F] p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#9AA0A6]">
                    Тренировка дня
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold">
                    5 кругов на время
                  </h2>
                  <p className="mt-3 max-w-2xl text-[#C4C7C5]">
                    400 м бег, 25 приседаний, 20 выпадов, 15 берпи, 1 минута
                    планки. После выполнения пользователь может указать время,
                    калории и прикрепить фото.
                  </p>
                  <p className="mt-3 text-sm text-[#9AA0A6]">
                    Твоя цель: {user.goal || "выиграть сезон и не выпадать из ритма"}
                  </p>
                </div>

                <button className="rounded-full bg-[#C4EEDB] px-5 py-3 font-semibold text-[#062E2B] transition hover:bg-[#D8F6E9]">
                  Отчитаться
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/10 bg-black/15 p-4">
                  <div className="flex items-center gap-2 text-[#9AA0A6]">
                    <Clock3 className="h-4 w-4" />
                    Время
                  </div>
                  <div className="mt-2 text-xl font-semibold">22:14</div>
                </div>

                <div className="rounded-[1.4rem] border border-white/10 bg-black/15 p-4">
                  <div className="flex items-center gap-2 text-[#9AA0A6]">
                    <Flame className="h-4 w-4" />
                    Калории
                  </div>
                  <div className="mt-2 text-xl font-semibold">486 ккал</div>
                </div>

                <div className="rounded-[1.4rem] border border-white/10 bg-black/15 p-4">
                  <div className="flex items-center gap-2 text-[#9AA0A6]">
                    <Camera className="h-4 w-4" />
                    Медиа
                  </div>
                  <div className="mt-2 text-xl font-semibold">2 фото</div>
                </div>
              </div>
            </section>

            <PostComposer />

            <section className="rounded-[2rem] bg-[#171A1F] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#9AA0A6]">
                    Лента спортсменов
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold">
                    Что сегодня сделали участники
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {posts.length === 0 ? (
                  <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-[#111318] p-6 text-[#9AA0A6]">
                    Лента пока пустая. Опубликуй первую тренировку и задай тон
                    всей секте спортсменов.
                  </div>
                ) : (
                  posts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-[1.6rem] border border-white/8 bg-[#111318] p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold">
                            {post.authorName}
                          </h3>
                          <p className="mt-1 text-sm text-[#9AA0A6]">
                            {formatPostTime(post.createdAt)}
                          </p>
                        </div>
                        <div className="rounded-full bg-white/6 px-3 py-1 text-sm text-[#C4C7C5]">
                          Тренировка
                        </div>
                      </div>

                      <p className="mt-4 text-lg">{post.workout}</p>
                      <p className="mt-2 text-[#C4C7C5]">{post.stats}</p>

                      <div className="mt-5 flex items-center gap-5 text-sm text-[#9AA0A6]">
                        <span className="flex items-center gap-2">
                          <Flame className="h-4 w-4" />
                          заряжает
                        </span>
                        <span className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />скоро комментарии
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] bg-[#171A1F] p-6">
              <div className="flex items-center gap-3 text-[#FDE293]">
                <Swords className="h-5 w-5" />
                <h2 className="text-2xl font-semibold">Батлы</h2>
              </div>
              <div className="mt-5 space-y-4">
                {battles.map((battle) => (
                  <article
                    key={battle.title}
                    className="rounded-[1.5rem] border border-white/10 bg-[#111318] p-4"
                  >
                    <h3 className="text-lg font-semibold">{battle.title}</h3>
                    <p className="mt-2 text-[#C4C7C5]">{battle.rival}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-[#9AA0A6]">
                      <span>{battle.stake}</span>
                      <span>{battle.reward}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-[#171A1F] p-6">
              <div className="flex items-center gap-3 text-[#C4EEDB]">
                <Wallet className="h-5 w-5" />
                <h2 className="text-2xl font-semibold">Кошелек сезона</h2>
              </div>
              <div className="mt-5 space-y-3 text-[#C4C7C5]">
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span>Баланс батлов</span>
                  <span className="font-semibold text-white">450 ₽</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span>Возможный выигрыш</span>
                  <span className="font-semibold text-white">1 150 ₽</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span>Призовой фонд месяца</span>
                  <span className="font-semibold text-white">12 000 ₽</span>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-[#171A1F] p-6">
              <div className="flex items-center gap-3 text-[#A8C7FA]">
                <Medal className="h-5 w-5" />
                <h2 className="text-2xl font-semibold">Что удерживает интерес</h2>
              </div>
              <ul className="mt-5 space-y-3 text-[#C4C7C5]">
                <li>Ежедневная тренировка дня с быстрым отчетом по времени и ккал.</li>
                <li>Лента с фото и тренировками других участников.</li>
                <li>Живые батлы один на один с денежным входом.</li>
                <li>Большие сезонные челленджи с призами и рейтингом.</li>
              </ul>

              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 transition hover:bg-white/5"
              >
                Вернуться на главную
                <ArrowRight className="h-4 w-4" />
              </Link>

              <form action={logout} className="mt-3">
                <button className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 transition hover:bg-white/5">
                  Выйти из аккаунта
                </button>
              </form>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function formatPostTime(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (minutes < 60) {
    return `${minutes} мин назад`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ч назад`;
  }

  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}
