import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasTeacherAccess } from "@/lib/teacher";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LessonComposer } from "./_components/lesson-composer";

const NewLessonPage = async ({ params }: { params: { courseId: string } }) => {
  const { userId } = auth();

  if (!userId) {
    return redirect(
      `/sign-in?redirect_url=${encodeURIComponent(
        `/teacher/courses/${params.courseId}/chapters/new`
      )}`
    );
  }

  if (!(await hasTeacherAccess(userId))) {
    return redirect("/teacher-mode");
  }

  const course = await db.course.findUnique({
    where: { id: params.courseId, userId },
    select: { id: true, title: true },
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  return (
    <div className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full">
        <Link
          href={`/teacher/courses/${course.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course setup
        </Link>

        <div className="mt-4">
          <p className="eyebrow text-teal-700">Teacher studio</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            New lesson
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Add the title, description, video, access, quiz and assignment in
            one go. Anything you skip can be added later.
          </p>
        </div>

        <div className="mt-6 pb-10">
          <LessonComposer courseId={course.id} />
        </div>
      </div>
    </div>
  );
};

export default NewLessonPage;