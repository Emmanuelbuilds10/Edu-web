import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasTeacherAccess } from "@/lib/teacher";
import { columns } from "./_components/columns";
import { DataTable } from "./_components/data-table";

const CoursesPage = async () => {
  const { userId } = auth();

  if (!userId) {
    return redirect(`/sign-in?redirect_url=${encodeURIComponent("/teacher/courses")}`);
  }

  if (!(await hasTeacherAccess(userId))) {
    return redirect("/teacher-mode");
  }

  const courses = await db.course.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-teal-700">Teacher studio</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Your courses</h1>
            <p className="mt-1.5 text-sm text-slate-500">Create, refine, and publish learning experiences.</p>
          </div>
          <Link
            href="/teacher/create"
            className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
          >
            <PlusCircle className="h-4 w-4" />
            New course
          </Link>
        </div>

        <div className="surface-card p-4 md:p-6">
          <DataTable columns={columns} data={courses} />
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
