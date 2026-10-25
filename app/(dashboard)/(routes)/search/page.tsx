import { db } from "@/lib/db";
import { Categories } from "./_components/categories";
import { SearchInput } from "@/components/search-input";
import { getCourses } from "@/actions/get-courses";
import { auth } from "@/lib/auth";
import { CoursesList } from "@/components/courses-list";
import Link from "next/link";


interface SearchPageProps {
  searchParams: {
    title?: string
    categoryId?: string
    categoryIds?: string | string[]
  }
}

const SearchPage = async ({
  searchParams
}: SearchPageProps) => {
  const {userId} = auth()

  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const courses = await getCourses({
    userId: userId ?? undefined,
    title: searchParams.title,
    categoryId: searchParams.categoryId,
    categoryIds: searchParams.categoryIds
      ? Array.isArray(searchParams.categoryIds) ? searchParams.categoryIds : [searchParams.categoryIds]
      : undefined,
  })
  return (
    <>
    <div className="page-shell px-5 pt-6 md:hidden">
      <SearchInput />
    </div>
    <div className="page-shell min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
      <div><p className="eyebrow">Explore</p><h1 className="mt-1 text-3xl font-black tracking-tight">Find your next skill</h1><p className="mt-2 text-slate-500">Browse courses that meet you where your curiosity starts.</p></div>
      <Categories items={categories} />
      {await TeacherSearchResults({ query: searchParams.title ?? undefined, userId: userId ?? undefined })}
      <CoursesList items={courses} />
      </div>
    </div>
    </>
  );
};

async function TeacherSearchResults({ query, userId }: { query?: string; userId?: string }) {
  const teacherCourseOwners = await db.course.findMany({
    where: { isPublished: true },
    select: { userId: true },
    distinct: ["userId"],
  });
  const teacherIds = Array.from(new Set(teacherCourseOwners.map(({ userId: teacherId }) => teacherId)));
  if (!teacherIds.length) return null;

  const [profiles, teacherDetails, follows] = await Promise.all([
    db.userProfile.findMany({ where: { userId: { in: teacherIds } }, orderBy: { username: "asc" } }),
    db.teacherProfile.findMany({ where: { userId: { in: teacherIds } }, select: { userId: true, headline: true, expertise: true } }),
    userId ? db.teacherFollow.findMany({ where: { followerId: userId }, select: { teacherId: true } }) : Promise.resolve([]),
  ]);
  const detailByUserId = new Map(teacherDetails.map((teacher) => [teacher.userId, teacher]));
  const followedIds = new Set(follows.map((follow) => follow.teacherId));
  const normalizedQuery = query?.trim().toLocaleLowerCase();
  const matchingTeachers = profiles.filter((profile) => {
    if (!normalizedQuery) return true;
    const details = detailByUserId.get(profile.userId);
    const searchableText = [profile.username, profile.displayName, details?.headline, ...(details?.expertise ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return searchableText.includes(normalizedQuery);
  }).slice(0, 12);

  if (!matchingTeachers.length) return null;
  return <section className="space-y-3"><div><h2 className="text-xl font-bold">Teachers</h2><p className="text-sm text-slate-500">Follow teachers to get updates when they post or publish courses.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{matchingTeachers.map((teacher) => {
    const details = detailByUserId.get(teacher.userId);
    return <Link key={teacher.userId} href={`/teachers/${teacher.userId}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-neutral-400 hover:shadow-sm">
      {teacher.avatarUrl ? <img src={teacher.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-neutral-100 font-bold text-neutral-800">{(teacher.displayName || teacher.username).slice(0, 1).toUpperCase()}</span>}
      <span className="min-w-0"><span className="block truncate font-bold text-slate-900">{teacher.displayName || teacher.username}</span><span className="block truncate text-sm text-slate-500">@{teacher.username}{followedIds.has(teacher.userId) ? " · Following" : ""}</span>{details?.headline && <span className="mt-1 block truncate text-xs text-slate-500">{details.headline}</span>}</span>
    </Link>;
  })}</div></section>;
}

export default SearchPage;
