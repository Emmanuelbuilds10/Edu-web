import { auth, clerkClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, GraduationCap, Users } from "lucide-react";
import { FollowTeacherButton } from "./follow-button";

function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function TeacherPublicProfilePage({ params }: { params: { teacherId: string } }) {
  const { userId } = auth();
  const [profile, courses, communityProfile, followCount, existingFollow] = await Promise.all([
    db.teacherProfile.findUnique({ where: { userId: params.teacherId } }),
    db.course.findMany({
      where: { userId: params.teacherId, isPublished: true },
      select: { id: true, title: true, description: true, imageUrl: true, price: true, _count: { select: { chapters: true, purchases: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.userProfile.findUnique({ where: { userId: params.teacherId }, select: { displayName: true, avatarUrl: true } }),
    db.teacherFollow.count({ where: { teacherId: params.teacherId } }),
    userId && userId !== params.teacherId
      ? db.teacherFollow.findUnique({ where: { followerId_teacherId: { followerId: userId, teacherId: params.teacherId } }, select: { id: true } })
      : Promise.resolve(null),
  ]);
  if (courses.length === 0) notFound();

  const teacher = await clerkClient().users.getUser(params.teacherId).catch(() => null);
  if (!teacher) notFound();

  const name = communityProfile?.displayName || teacher.fullName || teacher.username || "Sabiplex teacher";
  const avatarUrl = communityProfile?.avatarUrl || teacher.imageUrl;
  const websiteUrl = safeExternalUrl(profile?.websiteUrl);
  const linkedinUrl = safeExternalUrl(profile?.linkedinUrl);
  const studentCount = courses.reduce((total, course) => total + course._count.purchases, 0);

  return (
    <main className="min-h-full bg-slate-50 px-5 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/search" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Browse courses</Link>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-100" />
          <div className="min-w-0 flex-1"><p className="eyebrow">Sabiplex teacher</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{name}</h1>{profile?.headline && <p className="mt-2 text-lg text-slate-600">{profile.headline}</p>}</div>
            {userId !== params.teacherId && <FollowTeacherButton teacherId={params.teacherId} initialFollowing={!!existingFollow} isSignedIn={!!userId} />}
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-y border-slate-100 py-5 text-sm text-slate-600"><span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" />{courses.length} {courses.length === 1 ? "course" : "courses"}</span><span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />{studentCount} {studentCount === 1 ? "learner" : "learners"}</span><span>{followCount} {followCount === 1 ? "follower" : "followers"}</span></div>
          {profile?.bio ? <div className="mt-7"><h2 className="text-lg font-bold">About</h2><p className="mt-2 whitespace-pre-line leading-7 text-slate-600">{profile.bio}</p></div> : <p className="mt-7 text-sm text-slate-500">This teacher has not added a bio yet.</p>}
          {!!profile?.expertise.length && <div className="mt-6"><h2 className="text-sm font-bold text-slate-900">Areas of expertise</h2><div className="mt-3 flex flex-wrap gap-2">{profile.expertise.map((topic) => <span key={topic} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">{topic}</span>)}</div></div>}
          {(websiteUrl || linkedinUrl) && <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">{websiteUrl && <a href={websiteUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">Website</a>}{linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">LinkedIn</a>}</div>}
        </section>

        <section className="mt-10"><div className="mb-5 flex items-center gap-3"><GraduationCap className="h-5 w-5" /><h2 className="text-2xl font-black">Courses by {name}</h2></div><div className="grid gap-4 sm:grid-cols-2">{courses.map((course) => <Link key={course.id} href={`/courses/${course.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">{course.imageUrl ? <img src={course.imageUrl} alt="" className="aspect-video w-full object-cover" /> : <div className="aspect-video bg-gradient-to-br from-neutral-200 to-slate-100" />}<div className="p-5"><h3 className="font-bold group-hover:underline">{course.title}</h3>{course.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{course.description}</p>}<p className="mt-4 text-xs text-slate-500">{course._count.chapters} lessons · {course._count.purchases} learners</p></div></Link>)}</div></section>
      </div>
    </main>
  );
}
