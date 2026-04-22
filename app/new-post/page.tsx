import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getSessionUserId } from "@/lib/auth";
import { PostComposer } from "@/app/profile/post-composer";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  return (
    <main className="min-h-screen bg-bg-main text-text-primary pb-24">

      <div className="sticky top-0 z-50 glass-panel px-5 py-4 flex items-center gap-3">
        <Link
          href="/profile"
          className="p-2 -ml-2 hover:bg-white/5 rounded-full transition active-scale"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold tracking-tight">Новый пост</h1>
      </div>

      <div className="mx-auto max-w-2xl p-5">
        <PostComposer />
      </div>
    </main>
  );
}