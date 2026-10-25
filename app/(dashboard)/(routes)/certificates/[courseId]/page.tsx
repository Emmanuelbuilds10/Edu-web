import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Award, GraduationCap } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { PrintCertificateButton } from "./print-button";

export default async function CertificatePage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [purchase, course] = await Promise.all([
    db.purchase.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: params.courseId } },
      select: { id: true },
    }),
    db.course.findUnique({
      where: { id: params.courseId },
      select: {
        title: true,
        isPublished: true,
        chapters: {
          where: { isPublished: true },
          select: { id: true },
        },
      },
    }),
  ]);

  if (!purchase || !course || !course.isPublished || course.chapters.length === 0) {
    notFound();
  }

  const completionWhere = {
      userId: user.id,
      chapterId: { in: course.chapters.map((chapter) => chapter.id) },
      isCompleted: true,
    };
  const [completedCount, latestCompletion] = await Promise.all([
    db.userProgress.count({ where: completionWhere }),
    db.userProgress.findFirst({
      where: completionWhere,
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  if (completedCount !== course.chapters.length || !latestCompletion) notFound();
  const completionDate = latestCompletion.updatedAt;
  const studentName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    "Student";

  return (
    <main className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="mb-5 flex items-center justify-between print:hidden">
        <div>
          <p className="eyebrow">Course completion</p>
          <h1 className="mt-1 text-2xl font-bold">Your certificate</h1>
        </div>
        <PrintCertificateButton />
      </div>

      <article className="relative overflow-hidden border-[10px] border-double border-neutral-700 bg-white px-8 py-14 text-center shadow-xl sm:px-16 sm:py-20 print:min-h-[7.5in] print:border-[10px] print:shadow-none">
        <div className="absolute inset-3 border border-neutral-200" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-50 text-neutral-700">
            <Award className="h-9 w-9" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-neutral-700">Certificate of completion</p>
          <h2 className="mt-8 text-lg text-slate-500">This certificate is proudly presented to</h2>
          <p className="mt-3 border-b border-neutral-200 px-4 pb-3 text-3xl font-bold text-slate-900 sm:text-5xl">{studentName}</p>
          <p className="mt-8 text-lg text-slate-500">for successfully completing</p>
          <p className="mt-3 text-2xl font-bold text-neutral-950 sm:text-4xl">{course.title}</p>
          <div className="mt-12 flex items-center gap-2 text-sm font-medium text-slate-500">
            <GraduationCap className="h-5 w-5 text-neutral-700" />
            Completed on {completionDate.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
          </div>
          <div className="mt-12 h-px w-48 bg-neutral-200" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Sabiplex Learning</p>
        </div>
      </article>
    </main>
  );
}
