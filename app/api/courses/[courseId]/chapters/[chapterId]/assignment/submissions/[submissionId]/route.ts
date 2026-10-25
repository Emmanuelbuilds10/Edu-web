import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: { courseId: string; chapterId: string; submissionId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const submission = await db.assignmentSubmission.findFirst({
    where: {
      id: params.submissionId,
      assignment: {
        chapter: { id: params.chapterId, courseId: params.courseId, course: { userId } },
      },
    },
    select: { id: true },
  });
  if (!submission) return new NextResponse("Submission not found.", { status: 404 });

  const parsed = z.object({ score: z.number().int().min(0).max(100), feedback: z.string().trim().max(2000) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a score from 0 to 100 and feedback up to 2,000 characters." }, { status: 400 });
  const updated = await db.assignmentSubmission.update({
    where: { id: submission.id },
    data: { score: parsed.data.score, feedback: parsed.data.feedback, status: "REVIEWED", reviewedAt: new Date() },
    select: { id: true, score: true, feedback: true, status: true, reviewedAt: true },
  });
  return NextResponse.json(updated);
}
