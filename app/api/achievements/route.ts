import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [lessonsCompleted, quizzesPassed, assignmentsSubmitted, postsCreated, dashboard] = await Promise.all([
    db.userProgress.count({ where: { userId, isCompleted: true, chapter: { isPublished: true } } }),
    db.quizAttempt.count({ where: { userId, passed: true } }),
    db.assignmentSubmission.count({ where: { userId } }),
    db.forumPost.count({ where: { authorId: userId } }),
    getDashboardCourses(userId),
  ]);
  return NextResponse.json({ lessonsCompleted, quizzesPassed, assignmentsSubmitted, postsCreated, completedCourses: dashboard.completedCourses.length });
}
