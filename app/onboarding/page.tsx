import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-80px] w-[400px] h-[400px] bg-orange-500/[0.04] rounded-full blur-3xl" />
      </div>
      <OnboardingForm />
    </main>
  );
}
