// Minimal admin auth: a single shared secret (ADMIN_SECRET, env only) gates
// access. On successful login we set a signed, httpOnly cookie so we don't
// have to keep re-sending the secret from the browser. No user accounts /
// sessions table needed for the MVP.

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ai_checker_admin";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function signingKey(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET is not configured on the server");
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", signingKey()).update(value).digest("hex");
}

export function verifyAdminSecret(candidate: string): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setAdminSession() {
  const store = await cookies();
  const issuedAt = Date.now().toString();
  const token = `${issuedAt}.${sign(issuedAt)}`;
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return false;
    const [issuedAt, signature] = token.split(".");
    if (!issuedAt || !signature) return false;
    const expected = sign(issuedAt);
    if (expected !== signature) return false;
    const age = Date.now() - parseInt(issuedAt, 10);
    return age >= 0 && age <= COOKIE_MAX_AGE * 1000;
  } catch {
    return false;
  }
}
