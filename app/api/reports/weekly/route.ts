import { NextResponse } from "next/server";

import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const dayKey = (date: Date) => {
  const copy = startOfDay(date);
  return `${copy.getFullYear()}-${copy.getMonth()}-${copy.getDate()}`;
};

const shortDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const escapeCsv = (value: string | number) => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvRow = (values: (string | number)[]) => values.map(escapeCsv).join(",");

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = startOfDay(new Date());
  weekStart.setDate(weekStart.getDate() - 6);

  const [profile, dashboard, weeklyProgress, weeklyAttempts] = await Promise.all([
    db.userProfile.findUnique({ where: { userId }, select: { displayName: true } }),
    getDashboardCourses(userId),
    db.userProgress.findMany({
      where: { userId, isCompleted: true, updatedAt: { gte: weekStart } },
      select: { updatedAt: true },
    }),
    db.quizAttempt.findMany({
      where: { userId, createdAt: { gte: weekStart } },
      select: { score: true, total: true, passed: true, createdAt: true },
    }),
  ]);

  const { completedCourses, coursesInProgress } = dashboard;
  const courses = [...coursesInProgress, ...completedCourses];
  const learnerName = profile?.displayName ?? "Sabiplex learner";

  const lessonsByDay = new Map<string, number>();
  weeklyProgress.forEach((item) => {
    const key = dayKey(item.updatedAt);
    lessonsByDay.set(key, (lessonsByDay.get(key) ?? 0) + 1);
  });

  const quizzesByDay = new Map<string, number>();
  weeklyAttempts.forEach((attempt) => {
    const key = dayKey(attempt.createdAt);
    quizzesByDay.set(key, (quizzesByDay.get(key) ?? 0) + 1);
  });

  const activeDates = new Set([
    ...weeklyProgress.map((item) => dayKey(item.updatedAt)),
    ...weeklyAttempts.map((attempt) => dayKey(attempt.createdAt)),
  ]);

  const scoredAttempts = weeklyAttempts.filter((attempt) => attempt.total > 0);
  const averageScore = scoredAttempts.length
    ? Math.round(
        scoredAttempts.reduce((sum, attempt) => sum + (attempt.score / attempt.total) * 100, 0) /
          scoredAttempts.length
      )
    : null;

  const reportDate = new Date();
  const periodLabel = `${shortDate(weekStart)} - ${reportDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  const rows: string[] = [];
  rows.push(csvRow(["Sabiplex weekly learning report"]));
  rows.push(csvRow(["Learner", learnerName]));
  rows.push(csvRow(["Period", periodLabel]));
  rows.push(csvRow(["Generated", reportDate.toISOString()]));
  rows.push("");

  rows.push(csvRow(["Summary"]));
  rows.push(csvRow(["Metric", "Value"]));
  rows.push(csvRow(["Lessons completed this week", weeklyProgress.length]));
  rows.push(csvRow(["Quiz attempts this week", weeklyAttempts.length]));
  rows.push(csvRow(["Average quiz score", averageScore === null ? "No quiz attempts" : `${averageScore}%`]));
  rows.push(csvRow(["Active days", `${activeDates.size} of 7`]));
  rows.push(csvRow(["Enrolled courses", courses.length]));
  rows.push(csvRow(["Courses completed", completedCourses.length]));
  rows.push("");

  rows.push(csvRow(["Daily activity"]));
  rows.push(csvRow(["Date", "Lessons completed", "Quiz attempts"]));
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + offset);
    const key = dayKey(date);
    rows.push(
      csvRow([
        date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        lessonsByDay.get(key) ?? 0,
        quizzesByDay.get(key) ?? 0,
      ])
    );
  }
  rows.push("");

  rows.push(csvRow(["Courses"]));
  rows.push(csvRow(["Course", "Category", "Progress", "Chapters completed", "Published chapters"]));
  if (courses.length === 0) {
    rows.push(csvRow(["No enrolled courses yet", "", "", "", ""]));
  } else {
    courses.forEach((course) => {
      const chapterCount = course.chapters.length;
      const completedChapters = Math.round(((course.progress ?? 0) / 100) * chapterCount);
      rows.push(
        csvRow([
          course.title,
          course.category?.name ?? "Uncategorized",
          `${Math.round(course.progress ?? 0)}%`,
          completedChapters,
          chapterCount,
        ])
      );
    });
  }

  const csv = `\uFEFF${rows.join("\r\n")}\r\n`;
  const filename = `sabiplex-weekly-report-${reportDate.toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
