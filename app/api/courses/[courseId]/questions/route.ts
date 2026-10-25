import { auth, currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

const questionSchema = z.object({
  title: z.string().trim().min(5).max(160),
  body: z.string().trim().min(10).max(3000),
});

async function canParticipate(courseId: string, userId: string) {
  const [purchase, course] = await Promise.all([
    db.purchase.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    }),
    db.course.findUnique({
      where: { id: courseId },
      select: { userId: true, isPublished: true },
    }),
  ]);

  return !!course && course.isPublished && (!!purchase || course.userId === userId);
}

export async function GET(
  _request: Request,
  { params }: { params: { courseId: string } }
) {
  const { userId } = auth();
  if (!userId || !(await canParticipate(params.courseId, userId))) {
    return NextResponse.json({ error: "Enroll in this course to view its Q&A." }, { status: 403 });
  }

  const questions = await db.courseQuestion.findMany({
    where: { courseId: params.courseId },
    select: {
      id: true,
      title: true,
      body: true,
      author: true,
      createdAt: true,
      answers: {
        select: { id: true, body: true, author: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(questions);
}

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to ask a question." }, { status: 401 });
  if (!(await canParticipate(params.courseId, userId))) {
    return NextResponse.json({ error: "Enroll in this course to ask a question." }, { status: 403 });
  }

  const parsed = questionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid question." }, { status: 400 });
  }

  const user = await currentUser();
  const author = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "Student";
  const question = await db.courseQuestion.create({
    data: { ...parsed.data, courseId: params.courseId, userId, author },
  });
  const course = await db.course.findUnique({ where: { id: params.courseId }, select: { userId: true } });
  if (course) await notifyUser({ recipientId: course.userId, actorId: userId, type: "COURSE_QUESTION", message: `asked a question about “${question.title}”`, href: `/courses/${params.courseId}/qa#${question.id}` });
  return NextResponse.json(question, { status: 201 });
}
