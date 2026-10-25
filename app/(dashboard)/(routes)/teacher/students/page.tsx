import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, GraduationCap, Users, Wallet } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasTeacherAccess } from "@/lib/teacher";
import { getCommunityIdentities } from "@/lib/community-profile";
import { formatPrice } from "@/lib/format";

export default async function StudentsPage() {
  const { userId } = auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent("/teacher/students")}`);
  if (!(await hasTeacherAccess(userId))) redirect("/teacher-mode");

  const enrollments = await db.purchase.findMany({
    where: { course: { userId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      amountPaidKobo: true,
      createdAt: true,
      course: { select: { id: true, title: true } },
    },
  });

  const identities = await getCommunityIdentities(enrollments.map((enrollment) => enrollment.userId));
  const learners = new Set(enrollments.map((enrollment) => enrollment.userId));
  const revenueKobo = enrollments.reduce((total, enrollment) => total + enrollment.amountPaidKobo, 0);
  const courses = new Set(enrollments.map((enrollment) => enrollment.course.id));

  const summary = [
    { label: "Enrolments", value: String(enrollments.length), Icon: GraduationCap },
    { label: "Unique learners", value: String(learners.size), Icon: Users },
    { label: "Courses with learners", value: String(courses.size), Icon: GraduationCap },
    { label: "Recorded revenue", value: formatPrice(revenueKobo / 100), Icon: Wallet },
  ];

  return (
    <div className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-teal-700">Teacher studio</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Students</h1>
            <p className="mt-1.5 text-sm text-slate-500">Everyone enrolled in your courses, newest first.</p>
          </div>
          <Link href="/teacher/analytics" className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:border-teal-200 hover:text-teal-700 md:text-sm">
            View earnings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summary.map(({ label, value, Icon }) => (
            <div key={label} className="surface-card p-5">
              <Icon className="h-5 w-5 text-teal-600" />
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="surface-card overflow-hidden">
          {enrollments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-3 font-bold text-slate-900">No enrolments yet</h2>
              <p className="mt-1 text-sm text-slate-500">Publish a course and students will appear here once they enrol.</p>
              <Link href="/teacher/courses" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline">
                Manage courses <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="hidden gap-4 bg-slate-50/80 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 sm:grid sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr]">
                <span>Learner</span>
                <span>Course</span>
                <span>Paid</span>
                <span>Enrolled</span>
              </div>
              {enrollments.map((enrollment) => {
                const identity = identities[enrollment.userId];
                const name = identity?.displayName || "Sabiplex learner";
                return (
                  <div key={enrollment.id} className="grid gap-2 px-6 py-4 text-sm transition hover:bg-slate-50/60 sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr] sm:items-center sm:gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      {identity?.avatarUrl ? (
                        <img src={identity.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">
                          {name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="truncate font-semibold text-slate-900">{name}</span>
                    </div>
                    <Link href={`/teacher/courses/${enrollment.course.id}`} className="truncate text-slate-600 hover:text-teal-700 hover:underline">
                      {enrollment.course.title}
                    </Link>
                    <span className="font-medium text-slate-700">
                      {enrollment.amountPaidKobo > 0 ? formatPrice(enrollment.amountPaidKobo / 100) : "Free"}
                    </span>
                    <span className="text-slate-500">{enrollment.createdAt.toLocaleDateString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
