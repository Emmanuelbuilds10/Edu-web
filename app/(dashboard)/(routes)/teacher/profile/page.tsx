import { auth, clerkClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasTeacherAccess } from "@/lib/teacher";
import { ProfileForm } from "./profile-form";
import Link from "next/link";

export default async function TeacherProfileEditorPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fteacher%2Fprofile");
  const [canTeach, user, profile] = await Promise.all([
    hasTeacherAccess(userId),
    clerkClient().users.getUser(userId),
    db.teacherProfile.findUnique({ where: { userId } }),
  ]);
  if (!canTeach) redirect("/teacher-mode");

  return (
    <main className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full">
        <p className="eyebrow text-teal-700">Teacher studio</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Your teacher profile</h1><p className="mt-1.5 text-sm text-slate-500">Help learners get to know you before they enroll.</p></div><Link href={`/teachers/${userId}`} className="text-sm font-semibold text-teal-700 underline-offset-4 hover:underline">View public profile</Link></div>
        <div className="surface-card my-6 flex items-center gap-4 p-5">
          {/* Clerk supplies the account photo; it does not need a configured image host. */}
          <img src={user.imageUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          <div><p className="font-bold text-slate-900">{user.fullName || user.username || "Teacher"}</p><p className="text-sm text-slate-500">Your name and photo come from your account settings.</p></div>
        </div>
        <ProfileForm initialValues={{ headline: profile?.headline ?? "", bio: profile?.bio ?? "", expertise: profile?.expertise.join(", ") ?? "", websiteUrl: profile?.websiteUrl ?? "", linkedinUrl: profile?.linkedinUrl ?? "" }} />
      </div>
    </main>
  );
}
