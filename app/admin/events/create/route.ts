import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { migrateEvents, createEvent } from "@/lib/events";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  await migrateEvents();

  const formData = await request.formData();

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const discipline = formData.get("discipline") as string;
  const mode = formData.get("mode") as string;
  const description = (formData.get("description") as string) || undefined;
  const starts_at = formData.get("starts_at") as string;
  const ends_at = formData.get("ends_at") as string;
  const daily_target = formData.get("daily_target")
    ? parseInt(formData.get("daily_target") as string, 10)
    : undefined;
  const total_target = formData.get("total_target")
    ? parseInt(formData.get("total_target") as string, 10)
    : undefined;
  const is_survival = formData.get("is_survival") === "true";
  const allow_eliminated = formData.get("allow_eliminated") !== "false";
  const badge_color = (formData.get("badge_color") as string) || undefined;
  const emoji = (formData.get("emoji") as string) || undefined;

  // Convert datetime-local to ISO
  const startsAtISO = new Date(starts_at).toISOString();
  const endsAtISO = new Date(ends_at).toISOString();

  await createEvent({
    title,
    slug,
    discipline,
    mode: mode as any,
    description,
    starts_at: startsAtISO,
    ends_at: endsAtISO,
    daily_target,
    total_target,
    is_survival,
    allow_eliminated,
    badge_color,
    emoji,
  });

  redirect("/admin/events");
}
