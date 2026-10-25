import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeDollarSign, BookOpen, ListChecks, Lightbulb } from "lucide-react";

import { auth } from "@/lib/auth";
import { hasTeacherAccess } from "@/lib/teacher";
import { CourseCreateForm } from "./_components/course-create-form";

const steps = [
  {
    icon: BookOpen,
    title: "Course details",
    description: "Add a description, cover image, and category so learners know what to expect.",
  },
  {
    icon: ListChecks,
    title: "Lessons and media",
    description: "Build chapters, upload lesson videos, and add quizzes or assignments.",
  },
  {
    icon: BadgeDollarSign,
    title: "Pricing and publish",
    description: "Choose free or paid, review everything, then publish when you are ready.",
  },
];

const CreatePage = async () => {
  const { userId } = auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent("/teacher/create")}`);
  if (!(await hasTeacherAccess(userId))) redirect("/teacher-mode");

  return (
    <div className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/teacher/courses"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to your courses
            </Link>
            <p className="eyebrow mt-5 text-teal-700">Teacher studio</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Create a course</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
              Start with a clear title. You will add lessons, media, and pricing in the course studio.
            </p>
          </div>
          <span className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur">
            Step 1 of 3
          </span>
        </header>

        <div className="grid gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7 2xl:col-span-8">
            <CourseCreateForm />
          </div>

          <aside className="space-y-5 xl:col-span-5 2xl:col-span-4">
            <section className="surface-card p-6">
              <h2 className="text-base font-bold text-slate-900">What happens next</h2>
              <p className="mt-1 text-sm text-slate-500">Three short steps to a published course.</p>
              <ol className="mt-5 space-y-5">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title} className="flex gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-100">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          <span className="mr-1.5 text-xs font-bold text-teal-600">0{index + 1}</span>
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{step.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-xs leading-5 text-slate-500">
                Nothing is visible to learners until you publish a course with at least one published lesson.
              </p>
            </section>

            <section className="surface-card p-6">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Title tips</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-5 text-slate-500">
                <li>Be specific: “Design Systems for Beginners” beats “Design”.</li>
                <li>Aim for under 60 characters so the title reads well on course cards.</li>
                <li>You can rename the course whenever you like before publishing.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
