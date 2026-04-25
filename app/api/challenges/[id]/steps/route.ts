import { NextRequest } from "next/server";
import { addSteps } from "@/lib/challenges";
import { getApiUserId, ok, err } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getApiUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const steps = Number(body?.steps);
  if (!steps || steps <= 0) return err("steps обязателен и должен быть > 0");

  const { id } = await params;
  await addSteps(userId, id, steps);
  return ok({ added: steps });
}
