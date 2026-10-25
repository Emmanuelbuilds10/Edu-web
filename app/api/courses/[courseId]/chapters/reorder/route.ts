import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const reorderSchema = z.object({
  list: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        position: z.number().int().min(1).max(10000),
      })
    )
    .min(1, "Nothing to reorder.")
    .max(500, "Too many chapters in one request."),
});

export async function PUT(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ownCourse = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      },
      select: { id: true },
    });
    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const parsed = reorderSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return new NextResponse(
        parsed.error.issues[0]?.message ?? "Invalid chapter order.",
        { status: 400 }
      );
    }

    // Only chapters of this course can be moved: ids from another teacher's
    // course are rejected instead of being updated.
    const chapters = await db.chapter.findMany({
      where: { courseId: params.courseId },
      select: { id: true },
    });
    const ownedIds = new Set(chapters.map((chapter) => chapter.id));
    if (parsed.data.list.some((item) => !ownedIds.has(item.id))) {
      return new NextResponse("That chapter does not belong to this course.", {
        status: 400,
      });
    }

    await db.$transaction(
      parsed.data.list.map((item) =>
        db.chapter.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    console.log("[REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}