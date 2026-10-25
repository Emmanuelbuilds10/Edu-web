import { db } from "@/lib/db";
import { hasTeacherAccess } from "@/lib/teacher";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getCourses } from "@/actions/get-courses";

export async function GET(request: Request) {
  const { userId } = auth();
  const { searchParams } = new URL(request.url);
  const courses = await getCourses({
    userId: userId ?? undefined,
    title: searchParams.get("title") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
  });
  const profiles = await db.userProfile.findMany({ where: { userId: { in: Array.from(new Set(courses.map((course) => course.userId))) } }, select: { userId: true, username: true, displayName: true } });
  const names = new Map(profiles.map((profile) => [profile.userId, profile.displayName || profile.username]));
  return NextResponse.json(courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    imageUrl: course.imageUrl,
    price: course.price,
    categoryId: course.categoryId,
    category: course.category?.name ?? null,
    teacherId: course.userId,
    teacherName: names.get(course.userId) ?? "Sabiplex Teacher",
    progress: course.progress,
    chapterCount: course.chapters.length,
    rating: course.reviews.length
      ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
      : null,
    reviewCount: course.reviews.length,
    purchased: course.purchases.length > 0,
  })));
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId || !(await hasTeacherAccess(userId))) {
      return NextResponse.json({ error: "Teacher access is required to create a course." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Give your course a title to continue." }, { status: 400 });
    }
    if (title.length > 120) {
      return NextResponse.json({ error: "Keep the title to 120 characters or fewer." }, { status: 400 });
    }

    const course = await db.course.create({
      data: {
        userId,
        title,
      },
    });
    return NextResponse.json(course);
  } catch (error) {
    console.log("[COURSES]", error);
    return NextResponse.json({ error: "Could not create the course. Please try again." }, { status: 500 });
  }
}
