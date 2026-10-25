import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CourseQA, type QuestionItem } from "./qa-client";

export default async function CourseQAPage({ params }: { params: { courseId: string } }) {
  const { userId } = auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/courses/${params.courseId}/qa`)}`);

  const course = await db.course.findUnique({
    where: { id: params.courseId },
    select: { id: true, title: true, isPublished: true, userId: true },
  });
  if (!course || !course.isPublished) notFound();

  const purchase = await db.purchase.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: { id: true },
  });
  if (!purchase && course.userId !== userId) redirect(`/courses/${course.id}`);

  const questions = await db.courseQuestion.findMany({
    where: { courseId: course.id },
    include: { answers: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  const initialQuestions: QuestionItem[] = questions.map((question) => ({
    ...question,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
    answers: question.answers.map((answer) => ({
      ...answer,
      createdAt: answer.createdAt.toISOString(),
      updatedAt: answer.updatedAt.toISOString(),
    })),
  }));

  return (
    <main className="min-h-full bg-slate-50 px-5 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <Link href={`/courses/${course.id}`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-neutral-600">
          <ArrowLeft className="h-4 w-4" /> Back to {course.title}
        </Link>
        <div className="mb-7">
          <p className="eyebrow">Learn together</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Course Q&amp;A</h1>
          <p className="mt-2 text-slate-600">Ask questions and share what you know with other learners.</p>
        </div>
        <CourseQA courseId={course.id} initialQuestions={initialQuestions} />
      </div>
    </main>
  );
}
