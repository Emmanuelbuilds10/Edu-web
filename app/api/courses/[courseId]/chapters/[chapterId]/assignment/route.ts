import { auth, currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { courseId: string; chapterId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const chapter = await db.chapter.findFirst({
    where: { id: params.chapterId, courseId: params.courseId, course: { userId } },
    select: { assignment: { include: { submissions: { orderBy: { submittedAt: "desc" } } } } },
  });
  if (!chapter) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(chapter.assignment?.submissions ?? []);
}

export async function POST(request: Request, { params }: { params: { courseId: string; chapterId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Sign in to submit your assignment.", { status: 401 });
  const purchase = await db.purchase.findUnique({ where: { userId_courseId: { userId, courseId: params.courseId } }, select: { id: true } });
  if (!purchase) return new NextResponse("Enroll in this course to submit the assignment.", { status: 403 });

  const assignment = await db.chapterAssignment.findFirst({
    where: { chapter: { id: params.chapterId, courseId: params.courseId, isPublished: true, course: { isPublished: true } } },
    select: { id: true },
  });
  if (!assignment) return new NextResponse("Assignment not found.", { status: 404 });

  const parsed = z.object({ response: z.string().trim().min(10).max(10000) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please add more detail to your answer (10–10,000 characters)." }, { status: 400 });
  const user = await currentUser();
  const studentName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "Student";
  const submission = await db.assignmentSubmission.upsert({
    where: { userId_assignmentId: { userId, assignmentId: assignment.id } },
    create: { userId, studentName, assignmentId: assignment.id, response: parsed.data.response },
    update: { studentName, response: parsed.data.response, status: "SUBMITTED", score: null, feedback: null, reviewedAt: null, submittedAt: new Date() },
    select: { id: true, status: true, submittedAt: true },
  });
  return NextResponse.json(submission, { status: 201 });
}
