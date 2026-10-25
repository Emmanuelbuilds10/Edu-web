import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Star } from "lucide-react";

import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { Skeleton } from "@/components/skeletons";

export async function FeaturedCourses() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      category: { select: { name: true } },
      chapters: { where: { isPublished: true }, select: { id: true } },
      reviews: { select: { rating: true } },
    },
  });

  if (!courses.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
        <h3 className="mt-3 text-lg font-bold text-slate-900">The first courses are being prepared</h3>
        <p className="mt-1 text-sm text-slate-500">Check back soon, or start teaching and publish yours.</p>
        <Link
          href="/teacher-mode"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          Become a teacher
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const teachers = await db.userProfile.findMany({
    where: { userId: { in: Array.from(new Set(courses.map((course) => course.userId))) } },
    select: { userId: true, displayName: true, username: true },
  });
  const teacherNames = new Map(teachers.map((teacher) => [teacher.userId, teacher.displayName || teacher.username]));

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {courses.map((course) => {
        const rating = course.reviews.length
          ? course.reviews.reduce((total, review) => total + review.rating, 0) / course.reviews.length
          : null;
        return (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
              <Image
                src={course.imageUrl || "/course-placeholder.svg"}
                alt={course.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              {course.category?.name && (
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 backdrop-blur">
                  {course.category.name}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900">{course.title}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {teacherNames.get(course.userId) || "Sabiplex teacher"} · {course.chapters.length}{" "}
                {course.chapters.length === 1 ? "lesson" : "lessons"}
              </p>
              {rating !== null && (
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {rating.toFixed(1)}
                  <span className="font-normal text-slate-400">({course.reviews.length})</span>
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-5">
                <span className="text-base font-black text-slate-900">
                  {course.price === 0 ? "Free" : formatPrice(course.price ?? 0)}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition group-hover:text-slate-900">
                  View course
                  <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function FeaturedCoursesSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center justify-between pt-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
