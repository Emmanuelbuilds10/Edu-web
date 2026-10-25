import { createHmac, timingSafeEqual } from "crypto";
import { scryptSync, randomBytes } from "crypto";

export const DEMO_SESSION_COOKIE = "sabiplex_demo_session";

const getSecret = () =>
  process.env.DEMO_AUTH_SECRET || "sabiplex-local-demo-secret-change-me";

/** Sign a short session token so the demo cookie cannot be forged. */
export function createSessionToken(userId: string, ttlDays = 30) {
  const expires = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expires}`;
  const signature = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token?: string | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expires, signature] = parts;
  if (!userId || !expires || !signature) return null;
  if (!Number.isFinite(Number(expires)) || Number(expires) < Date.now()) return null;

  const expected = createHmac("sha256", getSecret()).update(`${userId}.${expires}`).digest("hex");
  const received = Buffer.from(signature, "hex");
  const wanted = Buffer.from(expected, "hex");
  if (received.length !== wanted.length || !timingSafeEqual(received, wanted)) return null;
  return userId;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export const isDemoAuthEnabled = () =>
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY;
