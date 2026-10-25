import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: { teacherId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to follow teachers." }, { status: 401 });
  if (userId === params.teacherId) return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });

  const teacherExists = await db.course.findFirst({ where: { userId: params.teacherId, isPublished: true }, select: { id: true } });
  if (!teacherExists) return NextResponse.json({ error: "Teacher not found." }, { status: 404 });

  await db.teacherFollow.upsert({
    where: { followerId_teacherId: { followerId: userId, teacherId: params.teacherId } },
    create: { followerId: userId, teacherId: params.teacherId },
    update: {},
  });
  return NextResponse.json({ following: true });
}

export async function DELETE(_request: Request, { params }: { params: { teacherId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to manage follows." }, { status: 401 });
  await db.teacherFollow.deleteMany({ where: { followerId: userId, teacherId: params.teacherId } });
  return NextResponse.json({ following: false });
}
