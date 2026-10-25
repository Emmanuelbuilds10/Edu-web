import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasTeacherAccess } from "@/lib/teacher";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasTeacherAccess(userId))) return NextResponse.json({ error: "Teacher access required" }, { status: 403 });
  const courses = await db.course.findMany({
    where: { userId }, orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, description: true, imageUrl: true, price: true, isPublished: true,
      category: { select: { name: true } },
      _count: { select: { chapters: true, purchases: true, reviews: true } },
    },
  });
  return NextResponse.json(courses);
}
