import { NextRequest } from "next/server";
import { getMyDialogs } from "@/lib/messages";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);
  const dialogs = await getMyDialogs(userId);
  return ok(dialogs);
}
