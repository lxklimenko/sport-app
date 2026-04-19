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
import { addStepsAction } from "@/app/actions";
import { getSessionUserId } from "@/lib/auth";
import { getRecentPosts } from "@/lib/posts";
import { getUserById, getUsersCount } from "@/lib/users";
import {
  getActiveChallenge,
  getMyStats,
  isParticipant,
} from "@/lib/challenges";
import { PostComposer } from "@/app/profile/post-composer";

export const dynamic = "force-dynamic";

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

  const challenge = await getActiveChallenge();
  const joined = challenge ? await isParticipant(userId, challenge.id) : false;
  const stats = challenge && joined ? await getMyStats(userId, challenge.id) : null;

  const totalSteps = stats?.totalSteps ?? 0;
  const rank = stats?.rank ?? null;
  const totalParticipants = stats?.totalParticipants ?? usersCount;

  const placement = rank ? `#${rank}` : "—";
  const prizeBank = 1000 + totalParticipants * 350;

  const daysLeft = challenge
    ? Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000))
    : 0;
  const progress = challenge
    ? Math.min(100, Math.round(((challenge.days - daysLeft) / challenge.days) * 100))
    : 0;

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
                {user.name}, {rank === 1 ? "ты лидер челленджа." : joined ? "ты внутри сезона." : "добавь шаги чтобы попасть в рейтинг."}
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
                <div className="text-sm text-[#9AA0A6]">Шаги в челлендже</div>
                <div className="mt-2 text-3xl font-semibold">
                  {totalSteps.toLocaleString("ru-RU")}
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
                <h2 className="mt-4 text-2xl font-semibold">
                  {challenge?.title ?? "Нет активных"}
                </h2>
                <p className="mt-2 text-[#C4C7C5]">
                  {challenge
                    ? `Осталось ${daysLeft} дней. ${joined
                        ? "Ты в челлендже — продолжай в том же духе."
                        : "Вступи, чтобы попасть в рейтинг."}`
                    : "Скоро появится новый челлендж."}
                </p>
                <div className="mt-6 h-3 rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-[#A8C7FA]"
                    style={{ width: `${progress}%` }}
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
                  <span className="text-sm">Участников</span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold">{totalParticipants}</h2>
                <p className="mt-2 text-[#C4C7C5]">
                  {totalParticipants === 0 ? "Будь первым!" : "В активном челлендже"}
                </p>
              </article>
            </div>

            <section className="rounded-[2rem] bg-[#171A1F] p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#9AA0A6]">
                    Добавить шаги
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold">
                    Сколько прошёл сегодня?
                  </h2>
                  <p className="mt-3 max-w-2xl text-[#C4C7C5]">
                    Введи количество шагов за сегодня. Они добавятся к твоему
                    общему счёту в челлендже и обновят позицию в рейтинге.
                  </p>
                  <p className="mt-3 text-sm text-[#9AA0A6]">
                    Лимит: до 50 000 шагов за раз.
                  </p>
                </div>
              </div>

              {!challenge ? (
                <div className="mt-6 rounded-[1.4rem] bg-black/20 p-6 text-center text-[#9AA0A6]">
                  Нет активного челленджа
                </div>
              ) : !joined ? (
                <div className="mt-6 rounded-[1.4rem] bg-black/20 p-6 text-center">
                  <p className="text-[#C4C7C5] mb-4">Сначала вступи в челлендж</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full bg-[#C4EEDB] px-5 py-3 font-semibold text-[#062E2B] transition hover:bg-[#D8F6E9]"
                  >
                    На главную <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <form action={addStepsAction} className="mt-6 flex gap-3 flex-col md:flex-row">
                  <input
                    name="steps"
                    type="number"
                    min="1"
                    max="50000"
                    required
                    placeholder="например 8500"
                    className="flex-1 rounded-full bg-black/20 border border-white/10 px-6 py-4 text-lg text-white placeholder-[#9AA0A6] outline-none focus:border-[#C4EEDB]"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[#C4EEDB] px-8 py-4 font-semibold text-[#062E2B] transition hover:bg-[#D8F6E9] cursor-pointer"
                  >
                    Добавить шаги
                  </button>
                </form>
              )}

              {joined && (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.4rem] border border-white/10 bg-black/15 p-4">
                    <div className="flex items-center gap-2 text-[#9AA0A6]">
                      <Footprints className="h-4 w-4" />
                      Всего шагов
                    </div>
                    <div className="mt-2 text-xl font-semibold">
                      {totalSteps.toLocaleString("ru-RU")}
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-white/10 bg-black/15 p-4">
                    <div className="flex items-center gap-2 text-[#9AA0A6]">
                      <Trophy className="h-4 w-4" />
                      Позиция
                    </div>
                    <div className="mt-2 text-xl font-semibold">{placement}</div>
                  </div>

                  <div className="rounded-[1.4rem] border border-white/10 bg-black/15 p-4">
                    <div className="flex items-center gap-2 text-[#9AA0A6]">
                      <Clock3 className="h-4 w-4" />
                      Осталось дней
                    </div>
                    <div className="mt-2 text-xl font-semibold">{daysLeft}</div>
                  </div>
                </div>
              )}
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