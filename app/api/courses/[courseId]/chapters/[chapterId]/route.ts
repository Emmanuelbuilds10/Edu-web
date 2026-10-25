import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function DELETE(_: Request, { params }: { params: { courseId: string; chapterId: string } }) {
  try {
    const { userId } = auth();
    const course = userId && await db.course.findUnique({ where: { id: params.courseId, userId } });
    if (!course) return new NextResponse("Unauthorized", { status: 401 });
    const chapter = await db.chapter.findUnique({ where: { id: params.chapterId, courseId: params.courseId } });
    if (!chapter) return new NextResponse("Not Found", { status: 404 });
    const deleted = await db.chapter.delete({ where: { id: params.chapterId } });
    if (!await db.chapter.count({ where: { courseId: params.courseId, isPublished: true } })) await db.course.update({ where: { id: params.courseId }, data: { isPublished: false } });
    return NextResponse.json(deleted);
  } catch { return new NextResponse("Internal Error", { status: 500 }); }
}

// Publishing stays on its own endpoint, and the chapter cannot be moved to
// another course, so only these fields are editable here.
const updateSchema = z.object({
  title: z.string().trim().min(1, "Give the chapter a title.").max(200),
  description: z.string().trim().max(20000).optional(),
  videoUrl: z.string().trim().max(4000).optional(),
  isFree: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: { courseId: string; chapterId: string } }) {
  try {
    const { userId } = auth();
    const course = userId && await db.course.findUnique({ where: { id: params.courseId, userId } });
    if (!course) return new NextResponse("Unauthorized", { status: 401 });

    const chapter = await db.chapter.findFirst({
      where: { id: params.chapterId, courseId: params.courseId },
      select: { id: true },
    });
    if (!chapter) return new NextResponse("Not Found", { status: 404 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return new NextResponse("Invalid chapter data.", { status: 400 });

    const parsed = updateSchema.partial().safeParse(body);
    if (!parsed.success) {
      return new NextResponse(parsed.error.issues[0]?.message ?? "Invalid chapter data.", { status: 400 });
    }

    const allowedKeys = ["title", "description", "videoUrl", "isFree"] as const;
    const data = Object.fromEntries(
      Object.entries(parsed.data).filter(([key]) => (allowedKeys as readonly string[]).includes(key))
    );

    return NextResponse.json(await db.chapter.update({ where: { id: chapter.id }, data }));
  } catch (error) {
    console.log("[CHAPTER_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}