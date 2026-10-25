import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const usernameSchema = z.object({ username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, "Use 3–20 letters, numbers, or underscores.") });

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to choose a username." }, { status: 401 });
  if (await db.userProfile.findUnique({ where: { userId }, select: { id: true } })) {
    return NextResponse.json({ error: "Your username is already set." }, { status: 409 });
  }

  const parsed = usernameSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid username." }, { status: 400 });
  try {
    const profile = await db.userProfile.create({ data: { userId, username: parsed.data.username, usernameChangedAt: new Date() } });
    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "That username is already taken. Try another." }, { status: 409 });
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to change your username." }, { status: 401 });
  const parsed = usernameSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid username." }, { status: 400 });

  const profile = await db.userProfile.findUnique({ where: { userId }, select: { username: true, usernameChangedAt: true, createdAt: true } });
  if (!profile) return NextResponse.json({ error: "Set up your username first." }, { status: 404 });
  if (parsed.data.username === profile.username) return NextResponse.json({ error: "That is already your username." }, { status: 400 });

  const lastChangedAt = profile.usernameChangedAt || profile.createdAt;
  const availableAt = new Date(lastChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (new Date() < availableAt) {
    return NextResponse.json({ error: `You can change your username again on ${availableAt.toLocaleDateString()}.`, availableAt: availableAt.toISOString() }, { status: 429 });
  }

  try {
    await db.userProfile.update({ where: { userId }, data: { username: parsed.data.username, usernameChangedAt: new Date() } });
    await Promise.all([
      db.forumPost.updateMany({ where: { authorId: userId }, data: { authorUsername: parsed.data.username } }),
      db.forumComment.updateMany({ where: { authorId: userId }, data: { authorUsername: parsed.data.username } }),
    ]);
    return NextResponse.json({ username: parsed.data.username });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "That username is already taken. Try another." }, { status: 409 });
    }
    throw error;
  }
}
