import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasTeacherAccess } from "@/lib/teacher";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasTeacherAccess(userId))) return NextResponse.json({ error: "Teacher access required" }, { status: 403 });
  const courses = await db.course.findMany({
    where: { userId }, select: { id: true, title: true, price: true, _count: { select: { purchases: true, reviews: true } }, reviews: { select: { rating: true } } },
  });
  const courseIds = courses.map(({ id }) => id);
  const [purchases, completedLessons] = await Promise.all([
    db.purchase.findMany({ where: { courseId: { in: courseIds } }, select: { amountPaidKobo: true } }),
    db.userProgress.count({ where: { isCompleted: true, chapter: { courseId: { in: courseIds } } } }),
  ]);
  const learners = courses.reduce((sum, course) => sum + course._count.purchases, 0);
  const ratings = courses.flatMap((course) => course.reviews.map(({ rating }) => rating));
  return NextResponse.json({
    courseCount: courses.length,
    learners,
    grossEarningsKobo: purchases.reduce((sum, purchase) => sum + purchase.amountPaidKobo, 0),
    completedLessons,
    averageRating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null,
    courses: courses.map((course) => ({ id: course.id, title: course.title, learners: course._count.purchases, reviews: course._count.reviews, rating: course.reviews.length ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length : null })),
  });
}
