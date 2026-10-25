import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isDemoAuth } from "@/lib/auth";
import { DEMO_SESSION_COOKIE, createSessionToken, verifyPassword } from "@/lib/demo-session";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function POST(request: Request) {
  if (!isDemoAuth) {
    return NextResponse.json({ error: "Local sign-in is disabled because Clerk is configured." }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid sign-in details." }, { status: 400 });
  }

  const user = await db.demoUser.findUnique({ where: { email: parsed.data.email } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ userId: user.id, role: user.role, name: user.name });
  response.cookies.set(DEMO_SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
