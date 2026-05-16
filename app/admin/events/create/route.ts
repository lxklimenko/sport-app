import { NextRequest, NextResponse } from "next/server";
import { migrateEvents, createEvent } from "@/lib/events";

export async function POST(request: NextRequest) {
  try {
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
    // If checkbox is unchecked, formData.get returns null → allow_eliminated = false
    // If checkbox is checked, formData.get returns "true" → allow_eliminated = true
    const allow_eliminated = formData.get("allow_eliminated") === "true";
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

    return NextResponse.redirect(new URL("/admin/events", request.url));
  } catch (error: any) {
    // Handle duplicate slug
    if (error?.code === "23505" && error?.constraint === "season_events_slug_key") {
      return NextResponse.json(
        { error: `Событие с slug "${error.detail?.match(/\(slug\)=\((.*?)\)/)?.[1] ?? ""}" уже существует` },
        { status: 409 }
      );
    }
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Ошибка при создании события" },
      { status: 500 }
    );
  }
}
