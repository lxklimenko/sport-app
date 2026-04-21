import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, Users as UsersIcon } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { searchUsers } from "@/lib/users";
import { toggleFollowAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const query = q ?? "";
  const users = await searchUsers(userId, query);

  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-20">

      <div className="sticky top-0 z-10 bg-[#0D0F12]/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <h1 className="font-semibold text-lg mb-3">Участники</h1>

        <form className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA0A6]" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Поиск по имени..."
            className="w-full bg-[#1E1F22] rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#A8C7FA] placeholder-[#9AA0A6]"
          />
        </form>
      </div>

      <div className="mx-auto max-w-2xl">

        {users.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 rounded-full bg-[#1E1F22] flex items-center justify-center mx-auto mb-5">
              <UsersIcon className="w-9 h-9 text-[#9AA0A6]" />
            </div>
            <h2 className="text-lg font-semibold mb-2">
              {query ? "Никого не нашли" : "Пока нет участников"}
            </h2>
            <p className="text-[#9AA0A6] text-sm">
              {query
                ? `По запросу "${query}" никого нет. Попробуй другое имя.`
                : "Как только кто-то зарегистрируется — появится здесь"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {users.map(u => {
              const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`;
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/user/${u.id}`} className="shrink-0">
                    <img
                      src={avatarUrl}
                      alt={u.name}
                      className="w-12 h-12 rounded-full bg-[#1E1F22]"
                    />
                  </Link>

                  <Link
                    href={`/user/${u.id}`}
                    className="flex-1 min-w-0 hover:opacity-80 transition"
                  >
                    <div className="font-semibold text-sm truncate">{u.name}</div>
                    <div className="text-xs text-[#9AA0A6] truncate">
                      {u.favoriteFormat}
                      {u.postsCount > 0 && ` · ${u.postsCount} ${u.postsCount === 1 ? "пост" : "постов"}`}
                    </div>
                  </Link>

                  <form action={toggleFollowAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button
                      type="submit"
                      className={`shrink-0 py-1.5 px-4 rounded-full text-xs font-semibold transition cursor-pointer ${
                        u.isFollowing
                          ? "bg-[#1E1F22] text-[#E3E3E3] hover:bg-[#2A2D33]"
                          : "bg-[#A8C7FA] text-[#062E6F] hover:bg-[#BBD6FE]"
                      }`}
                    >
                      {u.isFollowing ? "Отписаться" : "Подписаться"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}