import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function POST(request: Request, { params }: { params: { courseId: string; chapterId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Sign in to take this quiz.", { status: 401 });

  const purchase = await db.purchase.findUnique({ where: { userId_courseId: { userId, courseId: params.courseId } }, select: { id: true } });
  if (!purchase) return new NextResponse("Enroll in this course to take the quiz.", { status: 403 });

  const chapter = await db.chapter.findFirst({
    where: { id: params.chapterId, courseId: params.courseId, isPublished: true, course: { isPublished: true } },
    include: { quiz: { include: { questions: { orderBy: { position: "asc" } } } } },
  });
  if (!chapter?.quiz || !chapter.quiz.questions.length) return new NextResponse("Quiz not found.", { status: 404 });

  const parsed = z.object({ answers: z.array(z.number().int().min(0).max(3)).length(chapter.quiz.questions.length) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please answer every quiz question." }, { status: 400 });

  const score = chapter.quiz.questions.reduce((correct, question, index) => correct + Number(parsed.data.answers[index] === question.correctIndex), 0);
  const total = chapter.quiz.questions.length;
  const passed = score / total * 100 >= chapter.quiz.passPercent;
  await db.quizAttempt.upsert({
    where: { userId_quizId: { userId, quizId: chapter.quiz.id } },
    create: { userId, quizId: chapter.quiz.id, answers: parsed.data.answers, score, total, passed },
    update: { answers: parsed.data.answers, score, total, passed },
  });

  return NextResponse.json({
    score,
    total,
    passed,
    passPercent: chapter.quiz.passPercent,
    results: chapter.quiz.questions.map((question, index) => ({
      correct: parsed.data.answers[index] === question.correctIndex,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    })),
  });
}
