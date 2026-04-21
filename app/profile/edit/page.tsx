import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { EditProfileForm } from "@/app/profile/edit/edit-form";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await getUserById(userId);
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#0D0F12] text-[#F5F7FA] pb-24">

      <div className="sticky top-0 z-10 bg-[#0D0F12]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link
          href="/profile"
          className="p-2 -ml-2 hover:bg-white/5 rounded-full transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold">Редактировать профиль</h1>
      </div>

      <div className="mx-auto max-w-2xl p-5">
        <EditProfileForm
          initialName={user.name}
          initialFormat={user.favoriteFormat}
          initialGoal={user.goal}
        />
      </div>
    </main>
  );
}