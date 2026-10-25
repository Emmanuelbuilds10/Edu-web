/**
 * Authentication entry point used across the app.
 *
 * When Clerk keys are configured the real Clerk helpers are used. Without keys
 * (for example on a machine with no credentials) the app falls back to signed
 * cookie sessions backed by the local `DemoUser` collection, so students and
 * administrators can still sign in and use every feature.
 */
import { cookies } from "next/headers";
import {
  auth as clerkAuth,
  clerkClient as clerkClientFactory,
  currentUser as clerkCurrentUser,
} from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { DEMO_SESSION_COOKIE, verifySessionToken } from "@/lib/demo-session";

const hasClerkKeys = () =>
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

export const isDemoAuth = !hasClerkKeys();

export const DEMO_ACCOUNTS = {
  student: { email: "student@sabiplex.dev", password: "student123" },
  admin: { email: "admin@sabiplex.dev", password: "admin123" },
} as const;

export function getDemoSessionUserId(): string | null {
  const token = cookies().get(DEMO_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

type ClerkAuthResult = ReturnType<typeof clerkAuth>;

/** Mirror of Clerk's `auth()`; returns `{ userId }` in both modes. */
export function auth(): ClerkAuthResult {
  if (!isDemoAuth) return clerkAuth();

  const userId = getDemoSessionUserId();
  return {
    userId,
    sessionId: userId ? `demo_${userId}` : null,
    sessionClaims: userId ? { sub: userId } : null,
    actor: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    getToken: async () => null,
    has: () => false,
    debug: () => undefined,
  } as unknown as ClerkAuthResult;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function demoAvatarUrl(name: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="64" fill="#e2e8f0"/><text x="50%" y="50%" font-family="Arial, Helvetica, sans-serif" font-size="48" fill="#334155" text-anchor="middle" dominant-baseline="central">${initials(name) || "S"}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function demoUserRecord(userId: string) {
  const [user, profile] = await Promise.all([
    db.demoUser.findUnique({ where: { id: userId } }),
    db.userProfile.findUnique({ where: { userId }, select: { username: true, avatarUrl: true } }),
  ]);
  if (!user) return null;
  const [firstName, ...rest] = user.name.split(" ");
  return {
    id: user.id,
    firstName,
    lastName: rest.join(" ") || null,
    fullName: user.name,
    username: profile?.username ?? null,
    imageUrl: profile?.avatarUrl || demoAvatarUrl(user.name),
    primaryEmailAddress: { emailAddress: user.email },
    emailAddresses: [{ emailAddress: user.email }],
    publicMetadata: { role: user.role },
  };
}

/** Mirror of Clerk's `currentUser()`. */
export async function currentUser() {
  if (!isDemoAuth) return clerkCurrentUser();
  const { userId } = auth();
  if (!userId) return null;
  return (await demoUserRecord(userId)) as unknown as Awaited<ReturnType<typeof clerkCurrentUser>>;
}

/** Mirror of Clerk's `clerkClient()`, supporting the calls used by this app. */
export function clerkClient() {
  if (!isDemoAuth) return clerkClientFactory();

  return {
    users: {
      getUser: async (id: string) => {
        const user = await demoUserRecord(id);
        if (!user) throw new Error(`No demo user with id ${id}`);
        return user;
      },
      getUserList: async ({ emailAddress = [], limit = 10 }: { emailAddress?: string[]; limit?: number }) => {
        const matches = await db.demoUser.findMany({
          where: { email: { in: emailAddress.map((email) => email.toLowerCase()) } },
          take: limit,
        });
        const data = await Promise.all(matches.map((match) => demoUserRecord(match.id)));
        return { data: data.filter(Boolean) };
      },
    },
  } as unknown as ReturnType<typeof clerkClientFactory>;
}

export function isAdminUser(userId?: string | null) {
  return Boolean(userId) && (process.env.NEXT_PUBLIC_TEACHER_ID ?? "").split(/[\s,;]+/).includes(userId!);
}
