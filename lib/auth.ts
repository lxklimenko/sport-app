import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "discipline_session";
const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "dev-discipline-session-secret";
}

function signUserId(userId: string) {
  return createHmac("sha256", getSessionSecret()).update(userId).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function createSession(userId: string) {
  const store = await cookies();
  const signature = signUserId(userId);

  store.set(SESSION_COOKIE_NAME, `${userId}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_WEEK_IN_SECONDS,
  });
}

export async function getSessionUserId() {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    return null;
  }

  const [userId, signature] = session.split(".");

  if (!userId || !signature) {
    return null;
  }

  const expectedSignature = signUserId(userId);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  return userId;
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
