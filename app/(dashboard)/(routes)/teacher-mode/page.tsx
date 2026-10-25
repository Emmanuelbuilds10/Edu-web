import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasTeacherAccess, isTeacherAdmin } from "@/lib/teacher";
import { redirect } from "next/navigation";
import { TeacherModePanel } from "./teacher-mode-panel";

export default async function TeacherModePage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fteacher-mode");
  const [hasAccess, application] = await Promise.all([
    hasTeacherAccess(userId),
    db.teacherApplication.findUnique({ where: { userId }, select: { status: true } }),
  ]);

  return (
    <div className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
        <div>
          <p className="eyebrow text-teal-700">Teach on Sabiplex</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Choose your teaching mode</h1>
          <p className="mt-1.5 text-sm text-slate-500">Teach a course, or keep learning from your library.</p>
        </div>
        <div>
          <TeacherModePanel isTeacher={hasAccess} isAdmin={isTeacherAdmin(userId)} applicationStatus={application?.status ?? null} />
        </div>
      </div>
    </div>
  );
}
