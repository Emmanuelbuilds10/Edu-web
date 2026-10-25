import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Brain,
  Check,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function AchievementsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const [lessonsCompleted, quizzesPassed, quizAttempts, assignmentsSubmitted, plexxesMade, dashboard] =
    await Promise.all([
      db.userProgress.count({ where: { userId, isCompleted: true, chapter: { isPublished: true } } }),
      db.quizAttempt.count({ where: { userId, passed: true } }),
      db.quizAttempt.count({ where: { userId } }),
      db.assignmentSubmission.count({ where: { userId } }),
      db.forumPost.count({ where: { authorId: userId } }),
      getDashboardCourses(userId),
    ]);

  const completedCourses = dashboard.completedCourses.length;
  const badges = [
    { name: "First Step", description: "Complete your first lesson.", current: lessonsCompleted, target: 1, icon: BookOpenCheck },
    { name: "Lesson Explorer", description: "Complete 10 lessons.", current: lessonsCompleted, target: 10, icon: Target },
    { name: "Quiz Pass", description: "Pass your first chapter quiz.", current: quizzesPassed, target: 1, icon: Brain },
    { name: "Quiz Champion", description: "Pass five chapter quizzes.", current: quizzesPassed, target: 5, icon: Sparkles },
    { name: "Assignment Submitted", description: "Submit your first written assignment.", current: assignmentsSubmitted, target: 1, icon: ClipboardCheck },
    { name: "Make 3 Plexxes", description: "Create three posts in the Sabiplex forum.", current: plexxesMade, target: 3, icon: MessageSquare },
    { name: "Course Graduate", description: "Complete a full course and earn a certificate.", current: completedCourses, target: 1, icon: GraduationCap },
    { name: "Lifelong Learner", description: "Complete three full courses.", current: completedCourses, target: 3, icon: Award },
  ];

  const earnedCount = badges.filter((badge) => badge.current >= badge.target).length;
  const progressPercent = Math.round((earnedCount / badges.length) * 100);

  return (
    <main className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Achievements</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Your progress, celebrated. Keep learning to unlock every badge.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:border-teal-200 hover:text-teal-700 md:text-sm"
          >
            Back to overview <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="surface-card flex flex-col gap-6 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-100">
              <Trophy className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">Your progress</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {earnedCount} of {badges.length} badges earned
              </p>
              <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal-500" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mt-1.5 text-xs font-medium text-slate-500">{progressPercent}% of all milestones</p>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-center md:min-w-[320px]">
            <div>
              <dt className="text-[11px] font-medium text-slate-500">Lessons</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900">{lessonsCompleted}</dd>
            </div>
            <div className="border-x border-slate-200/70">
              <dt className="text-[11px] font-medium text-slate-500">Quizzes passed</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900">{quizzesPassed}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium text-slate-500">Courses finished</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900">{completedCourses}</dd>
            </div>
          </dl>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Badges</h2>
              <p className="mt-1 text-sm text-slate-500">Every lesson, quiz and post moves a badge forward.</p>
            </div>
            <p className="text-xs font-semibold text-slate-500">{quizAttempts} quiz attempts so far</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {badges.map((badge) => {
              const earned = badge.current >= badge.target;
              const percent = Math.min(100, Math.round((badge.current / badge.target) * 100));
              const Icon = badge.icon;

              return (
                <article
                  key={badge.name}
                  className={cn(
                    "surface-card flex flex-col p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,.08)]",
                    earned && "ring-1 ring-inset ring-teal-100"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "grid h-12 w-12 place-items-center rounded-xl ring-1 ring-inset",
                        earned ? "bg-teal-50 text-teal-600 ring-teal-100" : "bg-slate-50 text-slate-400 ring-slate-100"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    {earned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        <Check className="h-3 w-3" /> Earned
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                        {percent}%
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900">{badge.name}</h3>
                  <p className="mt-1 text-sm leading-snug text-slate-500">{badge.description}</p>

                  <div className="mt-auto pt-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn("h-full rounded-full", earned ? "bg-emerald-500" : "bg-teal-500")}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {Math.min(badge.current, badge.target)} / {badge.target}
                      <span className="text-slate-400">{earned ? " · complete" : " · keep going"}</span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <p className="text-sm text-slate-500">
          Completed courses also unlock downloadable certificates from your{" "}
          <Link href="/library" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
            learning library
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
