import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Clock3,
  Flame,
  GraduationCap,
  MessageSquare,
  PlayCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { CoursesList } from "@/components/courses-list";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { CategoryDonut } from "./_components/category-donut";
import { LearningActivityChart } from "./_components/learning-activity-chart";
import { WeeklyRhythm } from "./_components/weekly-rhythm";

const WEEKLY_GOAL = 5;

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

const statTones: Record<string, string> = {
  teal: "bg-teal-50 text-teal-600 ring-teal-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
};

export default async function Dashboard() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const [profile, dashboardCourses, lessonProgress, quizAttempts, assignmentsSubmitted, forumPosts] =
    await Promise.all([
      db.userProfile.findUnique({ where: { userId }, select: { displayName: true } }),
      getDashboardCourses(userId),
      db.userProgress.findMany({
        where: { userId, isCompleted: true },
        select: {
          id: true,
          updatedAt: true,
          chapter: { select: { title: true, course: { select: { title: true } } } },
        },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      db.quizAttempt.findMany({
        where: { userId },
        select: {
          id: true,
          score: true,
          total: true,
          passed: true,
          createdAt: true,
          quiz: {
            select: {
              title: true,
              chapter: { select: { course: { select: { title: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.assignmentSubmission.count({ where: { userId } }),
      db.forumPost.count({ where: { authorId: userId } }),
    ]);

  const { completedCourses, coursesInProgress } = dashboardCourses;
  const courses = [...coursesInProgress, ...completedCourses];
  const totalCourses = courses.length;
  const resume = coursesInProgress[0] ?? completedCourses[0] ?? null;

  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });

  const lessonsByDay = new Map<string, number>();
  lessonProgress.forEach((item) => {
    const key = dayKey(item.updatedAt);
    lessonsByDay.set(key, (lessonsByDay.get(key) ?? 0) + 1);
  });

  const quizzesByDay = new Map<string, number>();
  quizAttempts.forEach((attempt) => {
    const key = dayKey(attempt.createdAt);
    quizzesByDay.set(key, (quizzesByDay.get(key) ?? 0) + 1);
  });

  const activityData = days.map((date) => ({
    label: date.toLocaleDateString("en-US", { weekday: "short" }),
    fullLabel: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    lessons: lessonsByDay.get(dayKey(date)) ?? 0,
    quizzes: quizzesByDay.get(dayKey(date)) ?? 0,
  }));

  const rhythmDays = activityData.map((point, index) => ({
    ...point,
    shortLabel: point.label,
    isToday: index === activityData.length - 1,
  }));

  const weekStart = days[0];
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(weekStart.getDate() - 7);

  const lessonsThisWeek = lessonProgress.filter((item) => item.updatedAt >= weekStart).length;
  const lessonsLastWeek = lessonProgress.filter(
    (item) => item.updatedAt >= previousWeekStart && item.updatedAt < weekStart
  ).length;
  const weeklyDelta =
    lessonsLastWeek > 0
      ? Math.round(((lessonsThisWeek - lessonsLastWeek) / lessonsLastWeek) * 100)
      : null;
  const activeDaysThisWeek = activityData.filter((point) => point.lessons + point.quizzes > 0).length;

  const activeDates = new Set([
    ...lessonProgress.map((item) => dayKey(item.updatedAt)),
    ...quizAttempts.map((attempt) => dayKey(attempt.createdAt)),
  ]);
  let streak = 0;
  const streakCursor = new Date(today);
  if (!activeDates.has(dayKey(streakCursor))) {
    streakCursor.setDate(streakCursor.getDate() - 1);
  }
  while (activeDates.has(dayKey(streakCursor))) {
    streak += 1;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }

  const scoredAttempts = quizAttempts.filter((attempt) => attempt.total > 0);
  const averageQuizScore = scoredAttempts.length
    ? Math.round(
        scoredAttempts.reduce((sum, attempt) => sum + (attempt.score / attempt.total) * 100, 0) /
          scoredAttempts.length
      )
    : null;
  const quizzesPassed = quizAttempts.filter((attempt) => attempt.passed).length;

  const categoryTotals = new Map<string, { courses: number; progress: number }>();
  courses.forEach((course) => {
    const name = course.category?.name ?? "Other topics";
    const current = categoryTotals.get(name) ?? { courses: 0, progress: 0 };
    categoryTotals.set(name, {
      courses: current.courses + 1,
      progress: current.progress + (course.progress ?? 0),
    });
  });

  const sortedCategories = Array.from(categoryTotals.entries()).sort(
    (a, b) => b[1].courses - a[1].courses
  );
  const visibleCategories: [string, { courses: number; progress: number }][] =
    sortedCategories.length > 5
      ? [
          ...sortedCategories.slice(0, 4),
          [
            "Other topics",
            sortedCategories.slice(4).reduce(
              (total, [, value]) => ({
                courses: total.courses + value.courses,
                progress: total.progress + value.progress,
              }),
              { courses: 0, progress: 0 }
            ),
          ],
        ]
      : sortedCategories;

  const categoryData = visibleCategories.map(([name, value]) => ({
    name,
    courses: value.courses,
    percent: totalCourses ? Math.round((value.courses / totalCourses) * 100) : 0,
    progress: value.courses ? Math.round(value.progress / value.courses) : 0,
  }));

  const recentActivity = [
    ...lessonProgress.slice(0, 6).map((item) => ({
      id: `lesson-${item.id}`,
      kind: "lesson" as const,
      title: item.chapter.title,
      subtitle: item.chapter.course.title,
      meta: "+1 lesson",
      date: item.updatedAt,
      positive: true,
    })),
    ...quizAttempts.slice(0, 4).map((attempt) => ({
      id: `quiz-${attempt.id}`,
      kind: "quiz" as const,
      title: attempt.quiz.title,
      subtitle: attempt.quiz.chapter.course.title,
      meta: `${attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0}%`,
      date: attempt.createdAt,
      positive: attempt.passed,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const milestones = [
    { name: "First lesson", description: "Complete your first lesson", current: lessonProgress.length, target: 1, icon: CheckCircle2 },
    { name: "Quiz starter", description: "Pass your first chapter quiz", current: quizzesPassed, target: 1, icon: Brain },
    { name: "Five lessons", description: "Complete five lessons", current: lessonProgress.length, target: 5, icon: Target },
    { name: "Quiz champion", description: "Pass five chapter quizzes", current: quizzesPassed, target: 5, icon: Sparkles },
    { name: "First assignment", description: "Submit a written assignment", current: assignmentsSubmitted, target: 1, icon: ClipboardCheck },
    { name: "Course graduate", description: "Finish a full course", current: completedCourses.length, target: 1, icon: GraduationCap },
    { name: "Community voice", description: "Post three threads in the forum", current: forumPosts, target: 3, icon: MessageSquare },
  ]
    .filter((milestone) => milestone.current < milestone.target)
    .sort((a, b) => b.current / b.target - a.current / a.target)
    .slice(0, 3);

  const stats = [
    {
      label: "In progress",
      value: coursesInProgress.length,
      icon: BookOpen,
      tone: "teal",
      note: `${totalCourses} ${totalCourses === 1 ? "course" : "courses"} in your library`,
      trend: "neutral" as const,
    },
    {
      label: "Lessons completed",
      value: lessonProgress.length,
      icon: CheckCircle2,
      tone: "sky",
      note: `${lessonsThisWeek} completed this week`,
      trend: lessonsThisWeek > 0 ? ("up" as const) : ("neutral" as const),
    },
    {
      label: "Certificates",
      value: completedCourses.length,
      icon: Award,
      tone: "violet",
      note: `${quizzesPassed} ${quizzesPassed === 1 ? "quiz" : "quizzes"} passed`,
      trend: "neutral" as const,
    },
    {
      label: "Avg quiz score",
      value: averageQuizScore === null ? "—" : `${averageQuizScore}%`,
      icon: Brain,
      tone: "amber",
      note: `${quizAttempts.length} ${quizAttempts.length === 1 ? "attempt" : "attempts"} so far`,
      trend: "neutral" as const,
    },
    {
      label: "Day streak",
      value: streak,
      icon: Flame,
      tone: "rose",
      note: `${activeDaysThisWeek} of 7 active days`,
      trend: "neutral" as const,
    },
  ];

  const displayName = profile?.displayName ?? "learner";
  const weekRange = `${shortDate(days[0])} – ${days[6].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Overview</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Welcome back, {displayName}! Here’s what’s happening with your learning today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/reports/weekly"
              download
              className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 md:text-sm"
            >
              <Download className="h-4 w-4" />
              Weekly report
            </a>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur md:text-sm">
              <CalendarDays className="h-4 w-4 text-teal-600" />
              {weekRange}
            </div>
          </div>
        </header>

        <section aria-label="Learning summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article
                key={stat.label}
                className="surface-card flex flex-col p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,.08)]"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-full ring-1 ring-inset",
                      statTones[stat.tone]
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-tight text-slate-500">{stat.label}</p>
                    <p className="mt-1.5 text-2xl font-bold leading-none tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    "mt-4 flex items-center gap-1.5 text-xs font-medium",
                    stat.trend === "up" ? "text-emerald-600" : "text-slate-500"
                  )}
                >
                  {stat.trend === "up" && <TrendingUp className="h-3.5 w-3.5" />}
                  {stat.note}
                </p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-12 xl:gap-5">
          <article className="surface-card flex flex-col p-5 xl:col-span-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Learning activity</h2>
                <p className="mt-0.5 text-xs text-slate-500">Lessons completed over the last 7 days</p>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                This week
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-2">
              <p className="text-3xl font-bold tracking-tight text-slate-900">{lessonsThisWeek}</p>
              <p className="pb-1 text-sm text-slate-500">
                {lessonsThisWeek === 1 ? "lesson" : "lessons"} this week
              </p>
              <span
                className={cn(
                  "mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                  weeklyDelta === null || weeklyDelta >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-600"
                )}
              >
                <TrendingUp
                  className={cn("h-3.5 w-3.5", weeklyDelta !== null && weeklyDelta < 0 && "rotate-180")}
                />
                {weeklyDelta === null
                  ? "Start of your streak"
                  : `${weeklyDelta >= 0 ? "+" : ""}${weeklyDelta}% vs last week`}
              </span>
            </div>

            <div className="mt-2 flex-1">
              <LearningActivityChart data={activityData} />
            </div>
          </article>

          <article className="surface-card flex flex-col p-5 xl:col-span-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Topics</h2>
                <p className="mt-0.5 text-xs text-slate-500">Where your courses sit</p>
              </div>
              <Link href="/library" className="shrink-0 text-xs font-semibold text-teal-700 hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-5 flex flex-1 items-center">
              <CategoryDonut data={categoryData} total={totalCourses} />
            </div>
          </article>

          <article className="surface-card flex flex-col p-5 xl:col-span-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent activity</h2>
                <p className="mt-0.5 text-xs text-slate-500">Your latest learning moments</p>
              </div>
              <Link href="/achievements" className="shrink-0 text-xs font-semibold text-teal-700 hover:underline">
                View all
              </Link>
            </div>

            {recentActivity.length > 0 ? (
              <ul className="mt-4 flex-1 divide-y divide-slate-100">
                {recentActivity.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                        item.kind === "lesson"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-violet-50 text-violet-600"
                      )}
                    >
                      {item.kind === "lesson" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="truncate text-[11px] text-slate-400">{item.subtitle}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "text-xs font-bold",
                          item.positive ? "text-emerald-600" : "text-sky-600"
                        )}
                      >
                        {item.meta}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{shortDate(item.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                <Clock3 className="h-6 w-6 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">Nothing here yet</p>
                <p className="mt-1 text-xs text-slate-500">Complete a lesson and it will show up here.</p>
              </div>
            )}
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-12 xl:gap-5">
          <article className="surface-card flex flex-col overflow-hidden p-5 xl:col-span-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Continue learning</h2>
                <p className="mt-0.5 text-xs text-slate-500">Pick up where you left off</p>
              </div>
              <Link href="/library" className="shrink-0 text-xs font-semibold text-teal-700 hover:underline">
                My library
              </Link>
            </div>

            {resume ? (
              <Link
                href={`/courses/${resume.id}`}
                className="group relative mt-4 flex min-h-[196px] flex-1 flex-col justify-between overflow-hidden rounded-xl bg-slate-900 p-5 text-white"
              >
                <Image
                  src={resume.imageUrl ?? "/course-placeholder.svg"}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 30vw, 100vw"
                  className="object-cover opacity-45 transition duration-500 group-hover:scale-105 group-hover:opacity-35"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/10" />
                <div className="relative flex items-start justify-between gap-3">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold capitalize backdrop-blur">
                    {resume.category?.name ?? "Course"}
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
                    {Math.round(resume.progress ?? 0)}%
                  </span>
                </div>
                <div className="relative">
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug">{resume.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-200">
                    <Clock3 className="h-3.5 w-3.5" />
                    {resume.chapters.length} {resume.chapters.length === 1 ? "chapter" : "chapters"}
                    <span aria-hidden className="mx-1 h-1 w-1 rounded-full bg-slate-400" />
                    {resume.progress === 100 ? "Completed" : "In progress"}
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-teal-300"
                      style={{ width: `${Math.round(resume.progress ?? 0)}%` }}
                    />
                  </div>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white">
                    <PlayCircle className="h-4 w-4" />
                    {resume.progress === 100 ? "Review course" : "Resume learning"}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ) : (
              <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-8 text-center">
                <BookOpen className="h-6 w-6 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">Your shelf is empty</p>
                <p className="mt-1 text-xs text-slate-500">Find a course you love and start your first lesson.</p>
                <Link
                  href="/search"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-700"
                >
                  Browse courses <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </article>

          <article className="surface-card flex flex-col p-5 xl:col-span-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Next milestones</h2>
                <p className="mt-0.5 text-xs text-slate-500">Small goals to keep you moving</p>
              </div>
              <Link href="/achievements" className="shrink-0 text-xs font-semibold text-teal-700 hover:underline">
                All badges
              </Link>
            </div>

            {milestones.length > 0 ? (
              <ul className="mt-4 flex flex-1 flex-col justify-center gap-4">
                {milestones.map((milestone) => {
                  const Icon = milestone.icon;
                  const percent = Math.min(100, Math.round((milestone.current / milestone.target) * 100));
                  return (
                    <li key={milestone.name} className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-100">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800">{milestone.name}</p>
                          <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                            {Math.min(milestone.current, milestone.target)}/{milestone.target}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-slate-400">{milestone.description}</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-teal-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-5 py-8 text-center">
                <Award className="h-6 w-6 text-emerald-500" />
                <p className="mt-2 text-sm font-semibold text-emerald-800">Every badge earned</p>
                <p className="mt-1 text-xs text-emerald-700">You have unlocked all available milestones. Incredible work!</p>
              </div>
            )}
          </article>

          <article className="surface-card flex flex-col p-5 xl:col-span-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Weekly goal</h2>
                <p className="mt-0.5 text-xs text-slate-500">A little study every day</p>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                This week
              </span>
            </div>

            <div className="mt-5 flex-1">
              <WeeklyRhythm days={rhythmDays} goal={WEEKLY_GOAL} lessonsThisWeek={lessonsThisWeek} />
            </div>
          </article>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Your courses</h2>
              <p className="mt-1 text-sm text-slate-500">
                {totalCourses > 0
                  ? `${coursesInProgress.length} in progress · ${completedCourses.length} completed`
                  : "Courses you enrol in will appear here."}
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700"
            >
              Browse more <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <CoursesList items={courses} />
        </section>
      </div>
    </div>
  );
}
