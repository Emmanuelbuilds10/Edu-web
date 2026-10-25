import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_: Request, { params }: { params: { courseId: string } }) {
  const { userId } = auth();
  const existing = await db.course.findUnique({ where: { id: params.courseId }, select: { userId: true, isPublished: true } });
  if (!existing || (!existing.isPublished && existing.userId !== userId)) return new NextResponse("Not found", { status: 404 });
  const isOwner = existing.userId === userId;
  const course = await db.course.findUnique({
    where: { id: params.courseId },
    include: {
      category: true,
      chapters: {
        where: isOwner ? undefined : { isPublished: true },
        orderBy: { position: "asc" },
        include: { muxData: { select: { playbackId: true } }, quiz: { include: { questions: { orderBy: { position: "asc" } } } }, assignment: true },
      },
      reviews: { select: { rating: true, comment: true, createdAt: true } },
    },
  });
  if (!course) return new NextResponse("Not found", { status: 404 });
  const purchase = userId ? await db.purchase.findUnique({ where: { userId_courseId: { userId, courseId: course.id } }, select: { id: true } }) : null;
  const teacherProfile = await db.userProfile.findUnique({ where: { userId: course.userId }, select: { username: true, displayName: true } });
  const enrolled = isOwner || !!purchase;
  return NextResponse.json({
    id: course.id, title: course.title, description: course.description, imageUrl: course.imageUrl,
    price: course.price, category: course.category?.name ?? null, categoryId: course.categoryId,
    teacherId: course.userId, isPublished: course.isPublished, enrolled, isOwner,
    teacherName: teacherProfile?.displayName || teacherProfile?.username || "Sabiplex Teacher",
    chapters: course.chapters.map((chapter) => ({
      id: chapter.id, title: chapter.title, description: chapter.description, position: chapter.position,
      isPublished: chapter.isPublished, isFree: chapter.isFree,
      videoUrl: enrolled || chapter.isFree ? chapter.videoUrl : null,
      playbackId: enrolled || chapter.isFree ? chapter.muxData?.playbackId ?? null : null,
      quiz: chapter.quiz ? { id: chapter.quiz.id, title: chapter.quiz.title, passPercent: chapter.quiz.passPercent, questions: chapter.quiz.questions.map(({ correctIndex: _correctIndex, ...question }) => question) } : null,
      assignment: chapter.assignment ? { id: chapter.assignment.id, title: chapter.assignment.title, instructions: chapter.assignment.instructions } : null,
    })),
    reviews: course.reviews,
    rating: course.reviews.length ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length : null,
  });
}

export async function DELETE(_: Request, { params }: { params: { courseId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const course = await db.course.findUnique({ where: { id: params.courseId, userId } });
    if (!course) return new NextResponse("Not Found", { status: 404 });
    return NextResponse.json(await db.course.delete({ where: { id: params.courseId } }));
  } catch { return new NextResponse("Internal Error", { status: 500 }); }
}

// Only these fields can be edited from the course studio. Everything else
// (isPublished, userId, createdAt, ...) is ignored so a request can never
// publish an incomplete course or move it to another account.
const updateSchema = z.object({
  title: z.string().trim().min(1, "Give the course a title.").max(120),
  description: z.string().trim().max(5000).optional(),
  imageUrl: z.string().trim().max(1000).optional(),
  price: z.coerce.number().min(0, "Price cannot be negative.").max(100000000),
  categoryId: z.string().trim().min(1).max(100).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { courseId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Ownership is checked before any write so a non-owner gets a clean 404
    // instead of a Prisma error.
    const course = await db.course.findUnique({ where: { id: params.courseId, userId }, select: { id: true } });
    if (!course) return new NextResponse("Not found", { status: 404 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return new NextResponse("Invalid course data.", { status: 400 });

    const parsed = updateSchema.partial().safeParse(body);
    if (!parsed.success) {
      return new NextResponse(parsed.error.issues[0]?.message ?? "Invalid course data.", { status: 400 });
    }

    // Drop keys the client sent that are not part of the allow-list.
    const allowedKeys = ["title", "description", "imageUrl", "price", "categoryId"] as const;
    const data = Object.fromEntries(
      Object.entries(parsed.data).filter(([key]) => (allowedKeys as readonly string[]).includes(key))
    );

    return NextResponse.json(await db.course.update({ where: { id: course.id }, data }));
  } catch (error) {
    console.log("[COURSE_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}