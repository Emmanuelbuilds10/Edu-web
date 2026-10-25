import { auth, currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { courseId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [purchase, course, user] = await Promise.all([
    db.purchase.findUnique({ where: { userId_courseId: { userId, courseId: params.courseId } }, select: { id: true } }),
    db.course.findUnique({ where: { id: params.courseId }, select: { title: true, isPublished: true, chapters: { where: { isPublished: true }, select: { id: true } } } }),
    currentUser(),
  ]);
  if (!purchase || !course?.isPublished || !course.chapters.length) return NextResponse.json({ error: "Course completion required" }, { status: 404 });
  const completed = await db.userProgress.findMany({
    where: { userId, isCompleted: true, chapterId: { in: course.chapters.map(({ id }) => id) } },
    orderBy: { updatedAt: "desc" }, select: { chapterId: true, updatedAt: true },
  });
  if (new Set(completed.map(({ chapterId }) => chapterId)).size !== course.chapters.length) return NextResponse.json({ error: "Course completion required" }, { status: 404 });
  return NextResponse.json({
    courseTitle: course.title,
    studentName: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || user?.primaryEmailAddress?.emailAddress || "Student",
    completionDate: completed[0].updatedAt.toISOString(),
  });
}
