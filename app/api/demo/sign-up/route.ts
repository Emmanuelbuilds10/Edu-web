import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isDemoAuth } from "@/lib/auth";
import { DEMO_SESSION_COOKIE, createSessionToken, hashPassword } from "@/lib/demo-session";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export async function POST(request: Request) {
  if (!isDemoAuth) {
    return NextResponse.json({ error: "Local sign-up is disabled because Clerk is configured." }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid sign-up details." }, { status: 400 });
  }

  const existing = await db.demoUser.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const user = await db.demoUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
      role: "STUDENT",
    },
  });

  const response = NextResponse.json({ userId: user.id, role: user.role, name: user.name }, { status: 201 });
  response.cookies.set(DEMO_SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
