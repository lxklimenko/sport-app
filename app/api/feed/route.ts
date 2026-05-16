import { NextResponse } from "next/server";
import { getLiveFeed } from "@/lib/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await getLiveFeed(20);
  return NextResponse.json(feed);
}
