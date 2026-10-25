import { auth, currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

const answerSchema = z.object({
  body: z.string().trim().min(2).max(3000),
});

export async function POST(
  request: Request,
  { params }: { params: { courseId: string; questionId: string } }
) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to reply." }, { status: 401 });

  const question = await db.courseQuestion.findFirst({
    where: { id: params.questionId, courseId: params.courseId },
    select: { id: true, userId: true, title: true },
  });
  const [purchase, course] = await Promise.all([
    db.purchase.findUnique({
      where: { userId_courseId: { userId, courseId: params.courseId } },
      select: { id: true },
    }),
    db.course.findUnique({
      where: { id: params.courseId },
      select: { userId: true, isPublished: true },
    }),
  ]);
  if (!question || !course || !course.isPublished || (!purchase && course.userId !== userId)) {
    return NextResponse.json({ error: "Enroll in this course to reply." }, { status: 403 });
  }

  const parsed = answerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid reply." }, { status: 400 });
  }

  const user = await currentUser();
  const author = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "Student";
  const answer = await db.courseAnswer.create({
    data: { ...parsed.data, questionId: question.id, userId, author },
  });
  await notifyUser({ recipientId: question.userId, actorId: userId, type: "COURSE_ANSWER", message: `replied to your course question “${question.title}”`, href: `/courses/${params.courseId}/qa#${question.id}` });
  return NextResponse.json(answer, { status: 201 });
}
