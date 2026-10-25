import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { coursesInProgress, completedCourses } = await getDashboardCourses(userId);
  const safeCourse = (course: (typeof coursesInProgress)[number]) => ({
    id: course.id, title: course.title, description: course.description, imageUrl: course.imageUrl,
    price: course.price, category: course.category?.name ?? null, progress: course.progress,
    chapters: course.chapters.map(({ id, title, position, isPublished, isFree }) => ({ id, title, position, isPublished, isFree })),
  });
  return NextResponse.json({ inProgress: coursesInProgress.map(safeCourse), completed: completedCourses.map(safeCourse) });
}
