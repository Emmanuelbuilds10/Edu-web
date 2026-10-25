import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Compass, LibraryBig } from "lucide-react";

import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { CoursesList } from "@/components/courses-list";
import { auth } from "@/lib/auth";

const statTones = {
  teal: "bg-teal-50 text-teal-600 ring-teal-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
};

export default async function LearningLibraryPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const { completedCourses, coursesInProgress } = await getDashboardCourses(userId);
  const courses = [...coursesInProgress, ...completedCourses];
  const total = courses.length;
  const chapterCount = courses.reduce((sum, course) => sum + course.chapters.length, 0);

  const stats = [
    { label: "Enrolled courses", value: total, icon: LibraryBig, tone: statTones.teal },
    { label: "In progress", value: coursesInProgress.length, icon: Clock3, tone: statTones.sky },
    { label: "Completed", value: completedCourses.length, icon: CheckCircle2, tone: statTones.emerald },
    { label: "Lessons available", value: chapterCount, icon: BookOpen, tone: statTones.violet },
  ];

  return (
    <div className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">My library</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              All your courses in one place. Continue a lesson or revisit one you have completed.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 md:text-sm"
          >
            <Compass className="h-4 w-4" />
            Browse courses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section aria-label="Library summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="surface-card flex items-center gap-3 p-4 md:p-5">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1 ring-inset ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none tracking-tight text-slate-900">{stat.value}</p>
                  <p className="mt-1 truncate text-xs font-medium text-slate-500">{stat.label}</p>
                </div>
              </article>
            );
          })}
        </section>

        {total === 0 ? (
          <section className="surface-card flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-100">
              <LibraryBig className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Your library is waiting</h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Enrol in your first course and its lessons will show up here, ready whenever you are.
            </p>
            <Link
              href="/search"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
            >
              Find a course <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <>
            <section>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-100">
                  <Clock3 className="h-4 w-4" />
                </span>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">In progress</h2>
                <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  {coursesInProgress.length}
                </span>
              </div>
              <CoursesList items={coursesInProgress} />
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Completed</h2>
                <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  {completedCourses.length}
                </span>
                {completedCourses.length > 0 && (
                  <p className="text-xs text-slate-500">Certificates are available from each finished course.</p>
                )}
              </div>
              <CoursesList items={completedCourses} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
