import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Flame,
  MessageCircle,
} from "lucide-react";

import { logout } from "@/app/actions/auth";
import { addStepsAction, toggleLikeAction, deletePostAction } from "@/app/actions";
import { getSessionUserId } from "@/lib/auth";
import { getRecentPosts } from "@/lib/posts";
import { getUserById } from "@/lib/users";
import { getMyChallenges } from "@/lib/challenges";
import { getPool, hasDatabase } from "@/lib/db";
import { PostComposer } from "@/app/profile/post-composer";

export const dynamic = "force-dynamic";

async function getTodaySteps(userId: string) {
  if (!hasDatabase()) return 0;
  const result = await getPool().query<{ total: string }>(
    `SELECT COALESCE(SUM(steps), 0)::text AS total 
     FROM step_entries 
     WHERE user_id = $1 AND entry_date = CURRENT_DATE`,
    [userId]
  );
  return Number(result.rows[0]?.total ?? 0);
}

async function getStepsToTop(challengeId: string, myTotalSteps: number) {
  if (!hasDatabase()) return null;
  const result = await getPool().query<{ total_steps: string }>(
    `SELECT total_steps::text FROM participants 
     WHERE challenge_id = $1 AND total_steps > $2
     ORDER BY total_steps ASC LIMIT 1`,
    [challengeId, myTotalSteps]
  );
  const nextAbove = result.rows[0];
  if (!nextAbove) return null;
  return Number(nextAbove.total_steps) - myTotalSteps + 1;
}

export default async function ProfilePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/signup");

  const user = await getUserById(userId);
  if (!user) redirect("/signup");

  const myChallenges = await getMyChallenges(userId);
  const posts = await getRecentPosts(20, userId);
  const todaySteps = await getTodaySteps(userId);

  const bestRank = myChallenges.length > 0
    ? Math.min(...myChallenges.map(c => c.rank))
    : null;

  const mainChallenge = myChallenges[0];
  const otherChallenges = myChallenges.slice(1);

  const stepsToTop = mainChallenge && mainChallenge.rank > 1
    ? await getStepsToTop(mainChallenge.challenge.id, mainChallenge.totalSteps)
    : null;

  const mainProgress = mainChallenge
    ? Math.min(100, Math.round(((mainChallenge.challenge.days -
        Math.max(0, Math.ceil((new Date(mainChallenge.challenge.endDate).getTime() - Date.now()) / 86400000))
      ) / mainChallenge.challenge.days) * 100))
    : 0;

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;

  return (
    <main className="min-h-screen bg-[#0D0F12] px-5 py-6 text-[#F5F7FA]">
      <div className="mx-auto max-w-2xl">

        <div className="flex items-center gap-5 mb-4">
          <img
            src={avatarUrl}
            alt={user.name}
            className="w-20 h-20 rounded-full bg-[#1E1F22]"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold truncate">{user.name}</h1>
            <p className="text-[#9AA0A6] text-sm">{user.favoriteFormat}</p>
            {user.goal && (
              <p className="text-[#9AA0A6] text-sm mt-1">🎯 {user.goal}</p>
            )}
          </div>
        </div>

        <div className="mb-8 text-[#C4C7C5] text-sm">
          🔥 Сегодня: +{todaySteps.toLocaleString("ru-RU")}
          {bestRank && (
            <span> · Лучшее место: #{bestRank}</span>
          )}
        </div>

        {mainChallenge ? (
          <div className="bg-[#1E1F22] rounded-3xl p-6 mb-6">

            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-[#9AA0A6]">🔥 Сейчас</div>
              <div className="text-sm font-semibold">#{mainChallenge.rank} из {mainChallenge.totalParticipants}</div>
            </div>

            <Link href={`/challenge/${mainChallenge.challenge.id}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{mainChallenge.challenge.emoji}</span>
                <h2 className="text-2xl font-semibold">
                  {mainChallenge.challenge.title}
                </h2>
              </div>
            </Link>

            <p className="text-[#C4C7C5] mb-1">
              {mainChallenge.totalSteps.toLocaleString("ru-RU")} {mainChallenge.challenge.unitLabel}
            </p>

            {stepsToTop && (
              <p className="text-xs text-[#A8C7FA] mb-4">
                +{stepsToTop.toLocaleString("ru-RU")} {mainChallenge.challenge.unitLabel} до ТОП-{mainChallenge.rank - 1}
              </p>
            )}

            <div className="h-2 bg-black/30 rounded-full mb-5">
              <div
                className="h-2 bg-[#A8C7FA] rounded-full transition-all"
                style={{ width: `${mainProgress}%` }}
              />
            </div>

            <form action={addStepsAction} className="flex gap-2">
              <input type="hidden" name="challengeId" value={mainChallenge.challenge.id} />
              <input
                name="steps"
                type="number"
                min="1"
                max={mainChallenge.challenge.dailyLimit}
                required
                placeholder={`Добавить ${mainChallenge.challenge.unitLabel}`}
                className="flex-1 bg-black/30 rounded-full px-5 py-3 text-sm text-white placeholder-[#9AA0A6] outline-none focus:ring-1 focus:ring-[#A8C7FA]"
              />
              <button
                type="submit"
                className="bg-[#A8C7FA] text-[#062E6F] px-6 rounded-full font-semibold text-sm hover:bg-[#BBD6FE] transition cursor-pointer"
              >
                +
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-[#1E1F22] rounded-3xl p-6 text-center mb-6">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-lg font-semibold mb-2">Ты ещё не в челленджах</p>
            <p className="text-[#9AA0A6] text-sm mb-5">Вступи и начни зарабатывать место в рейтинге</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#A8C7FA] px-6 py-3 font-semibold text-[#062E6F] hover:bg-[#BBD6FE] transition"
            >
              Выбрать челлендж
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {otherChallenges.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {otherChallenges.map((my) => {
              const daysLeft = Math.max(
                0,
                Math.ceil((new Date(my.challenge.endDate).getTime() - Date.now()) / 86400000)
              );
              return (
                <Link
                  key={my.challenge.id}
                  href={`/challenge/${my.challenge.id}`}
                  className="bg-[#1E1F22] rounded-2xl p-4 hover:bg-[#252730] transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{my.challenge.emoji}</span>
                    <span className="text-sm font-semibold truncate">
                      {my.challenge.title}
                    </span>
                  </div>
                  <div className="text-xs text-[#9AA0A6]">
                    #{my.rank} · {my.totalSteps.toLocaleString("ru-RU")} {my.challenge.unitLabel}
                  </div>
                  <div className="text-xs text-[#9AA0A6] mt-1">
                    осталось {daysLeft} дн.
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mb-6">
          <PostComposer />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 px-1">Лента</h2>

          {posts.length === 0 ? (
            <div className="bg-[#1E1F22] rounded-3xl p-6 text-center text-[#9AA0A6]">
              Пока пусто. Опубликуй первую тренировку.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-[#1E1F22] rounded-3xl overflow-hidden">
                  <div className="p-5 pb-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold">{post.authorName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#9AA0A6] text-xs">
                          {formatPostTime(post.createdAt)}
                        </span>
                        {post.userId === userId && (
                          <form action={deletePostAction}>
                            <input type="hidden" name="postId" value={post.id} />
                            <button
                              type="submit"
                              className="text-[#9AA0A6] hover:text-[#FFB4AB] transition text-xs"
                              title="Удалить пост"
                            >
                              Удалить
                            </button>
                          </form>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-lg leading-relaxed">{post.workout}</p>
                    <p className="mt-1 text-sm text-[#C4C7C5]">{post.stats}</p>
                  </div>

                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-full max-h-[500px] object-cover"
                    />
                  )}

                  <div className="p-5 pt-3 flex gap-5 text-[#9AA0A6]">
                    <form action={toggleLikeAction}>
                      <input type="hidden" name="postId" value={post.id} />
                      <button
                        type="submit"
                        className={`flex items-center gap-1.5 text-sm transition ${
                          post.likedByMe ? "text-[#FFB4AB]" : "hover:text-white"
                        }`}
                      >
                        <Flame
                          className="w-4 h-4"
                          fill={post.likedByMe ? "currentColor" : "none"}
                        />
                        <span>{post.likesCount}</span>
                      </button>
                    </form>
                    <button className="flex items-center gap-1.5 text-sm hover:text-white transition">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm hover:bg-white/5 transition"
          >
            На главную
            <ArrowRight className="w-4 h-4" />
          </Link>

          <form action={logout}>
            <button className="rounded-full px-5 py-3 text-sm hover:bg-white/5 transition">
              Выйти
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}

function formatPostTime(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}