import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const quizSchema = z.object({
  title: z.string().trim().min(2).max(160),
  passPercent: z.number().int().min(1).max(100),
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(5).max(1000),
        options: z.array(z.string().trim().min(1).max(300)).length(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: z.string().trim().max(1000).optional(),
      })
    )
    .min(1)
    .max(20),
});

const assignmentSchema = z.object({
  title: z.string().trim().min(2).max(160),
  instructions: z.string().trim().min(10).max(5000),
});

// Everything a teacher fills in on the "New lesson" screen arrives in one payload.
const createSchema = z.object({
  title: z.string().trim().min(1, "Give the lesson a title.").max(120),
  description: z.string().trim().max(20000).optional(),
  videoUrl: z.string().trim().max(4000).optional(),
  isFree: z.boolean().optional(),
  quiz: quizSchema.nullable().optional(),
  assignment: assignmentSchema.nullable().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return new NextResponse(
        parsed.error.issues[0]?.message ?? "Check the lesson details and try again.",
        { status: 400 }
      );
    }

    const { title, description, videoUrl, isFree, quiz, assignment } =
      parsed.data;

    const lastChapter = await db.chapter.findFirst({
      where: {
        courseId: params.courseId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = lastChapter ? lastChapter.position + 1 : 1;

    const chapter = await db.chapter.create({
      data: {
        title,
        courseId: params.courseId,
        position: newPosition,
        description: description || null,
        videoUrl: videoUrl || null,
        isFree: isFree ?? false,
        ...(quiz
          ? {
              quiz: {
                create: {
                  title: quiz.title,
                  passPercent: quiz.passPercent,
                  questions: {
                    create: quiz.questions.map((question, position) => ({
                      ...question,
                      position,
                    })),
                  },
                },
              },
            }
          : {}),
        ...(assignment
          ? { assignment: { create: { ...assignment } } }
          : {}),
      },
      include: {
        quiz: { select: { id: true } },
        assignment: { select: { id: true } },
      },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.log("[CHAPTERS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}