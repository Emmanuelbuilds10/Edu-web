import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const activitiesSchema = z.object({
  quiz: z.object({
    title: z.string().trim().min(2).max(160),
    passPercent: z.number().int().min(1).max(100),
    questions: z.array(z.object({
      prompt: z.string().trim().min(5).max(1000),
      options: z.array(z.string().trim().min(1).max(300)).length(4),
      correctIndex: z.number().int().min(0).max(3),
      explanation: z.string().trim().max(1000).optional(),
    })).min(1).max(20),
  }).nullable(),
  assignment: z.object({
    title: z.string().trim().min(2).max(160),
    instructions: z.string().trim().min(10).max(5000),
  }).nullable(),
});

export async function GET(_: Request, { params }: { params: { courseId: string; chapterId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const chapter = await db.chapter.findFirst({
    where: { id: params.chapterId, courseId: params.courseId, course: { userId } },
    include: { quiz: { include: { questions: { orderBy: { position: "asc" } } } }, assignment: true },
  });
  if (!chapter) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ quiz: chapter.quiz, assignment: chapter.assignment });
}

export async function PUT(request: Request, { params }: { params: { courseId: string; chapterId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const chapter = await db.chapter.findFirst({
    where: { id: params.chapterId, courseId: params.courseId, course: { userId } },
    select: { id: true },
  });
  if (!chapter) return new NextResponse("Not found", { status: 404 });

  const parsed = activitiesSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid activity" }, { status: 400 });
  const { quiz, assignment } = parsed.data;

  await db.$transaction(async (transaction) => {
    if (quiz) {
      await transaction.chapterQuiz.upsert({
        where: { chapterId: chapter.id },
        create: {
          chapterId: chapter.id,
          title: quiz.title,
          passPercent: quiz.passPercent,
          questions: { create: quiz.questions.map((question, position) => ({ ...question, position })) },
        },
        update: {
          title: quiz.title,
          passPercent: quiz.passPercent,
          questions: {
            deleteMany: {},
            create: quiz.questions.map((question, position) => ({ ...question, position })),
          },
        },
      });
    } else {
      await transaction.chapterQuiz.deleteMany({ where: { chapterId: chapter.id } });
    }

    if (assignment) {
      await transaction.chapterAssignment.upsert({
        where: { chapterId: chapter.id },
        create: { chapterId: chapter.id, ...assignment },
        update: assignment,
      });
    } else {
      await transaction.chapterAssignment.deleteMany({ where: { chapterId: chapter.id } });
    }
  });

  return NextResponse.json({ success: true });
}
