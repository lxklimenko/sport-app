import { NextRequest, NextResponse } from "next/server";
import { getLiveFeed, getFeedByRange, type FeedRange } from "@/lib/feed";
import { generateAtmosphericEvents } from "@/lib/feed-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range") as FeedRange | null;
  const limitParam = searchParams.get("limit");

  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  // Generate atmospheric events on each feed request (they dedupe internally)
  try {
    await generateAtmosphericEvents();
  } catch {
    // silent
  }

  if (rangeParam && ["day", "week", "month"].includes(rangeParam)) {
    const feed = await getFeedByRange(rangeParam, limit);
    return NextResponse.json(feed);
  }

  const feed = await getLiveFeed(limit);
  return NextResponse.json(feed);
}
