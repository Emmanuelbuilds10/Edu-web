import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hasTeacherAccess } from "@/lib/teacher";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clapperboard,
  Coins,
  Paperclip,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TitleForm } from "./_components/title-form";
import { DescriptionForm } from "./_components/description-form";
import { ImageForm } from "./_components/image-form";
import { CategoryForm } from "./_components/category-form";
import { PriceForm } from "./_components/price-form";
import { AttachmentForm } from "./_components/attachment-form";
import { ChaptersForm } from "./_components/chapters-form";
import { Banner } from "@/components/banner";
import { Actions } from "./_components/actions";

const SectionHeading = ({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof WandSparkles;
  title: string;
  description: string;
}) => (
  <div className="flex items-center gap-3">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.28)]">
      <Icon className="h-5 w-5" />
    </span>
    <div className="min-w-0">
      <h2 className="text-lg font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  </div>
);

const CourseIdPage = async ({ params }: { params: { courseId: string } }) => {
  const { userId } = auth();

  if (!userId) {
    return redirect(`/sign-in?redirect_url=${encodeURIComponent(`/teacher/courses/${params.courseId}`)}`);
  }

  if (!(await hasTeacherAccess(userId))) {
    return redirect("/teacher-mode");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId,
    },
    include: {
      chapters: {
        orderBy: {
          position: "asc",
        },
      },
      attachments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  const checklist = [
    { label: "Course title", done: Boolean(course.title) },
    { label: "Description", done: Boolean(course.description) },
    { label: "Cover image", done: Boolean(course.imageUrl) },
    // A price of 0 is valid: it means the course is free.
    { label: "Price (free = ₦0)", done: course.price !== null && course.price !== undefined },
    { label: "Category", done: Boolean(course.categoryId) },
    { label: "Published lesson", done: course.chapters.some((chapter) => chapter.isPublished) },
  ];
  const completedSteps = checklist.filter((item) => item.done).length;
  const completionPercent = Math.round((completedSteps / checklist.length) * 100);
  const isComplete = completedSteps === checklist.length;

  return (
    <>
      {!course.isPublished && (
        <Banner
          variant="warning"
          label="This course is a draft. Students can only find it after you publish it."
        />
      )}
      <div className="dashboard-canvas min-h-full p-5 md:p-8">
        <div className="w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <Link
                href="/teacher/courses"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> All courses
              </Link>
              <p className="eyebrow mt-4 text-teal-700">Teacher studio</p>
              <h1 className="mt-1 truncate text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Course setup
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                {course.title} · {completedSteps} of {checklist.length} setup
                steps complete
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Actions
                disabled={!isComplete}
                courseId={params.courseId}
                isPublished={course.isPublished}
              />
              {!isComplete && (
                <p className="max-w-xs text-xs leading-5 text-slate-500 sm:text-right">
                  Add a title, description, image, price (₦0 for free),
                  category and at least one published lesson to publish.
                </p>
              )}
            </div>
          </div>

          <div className="surface-card mt-6 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Publish checklist
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Complete every step to make the course available to learners.
                </p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                {completedSteps} / {checklist.length} complete
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {checklist.map((item) => (
                <li
                  key={item.label}
                  className={
                    item.done
                      ? "flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-800"
                      : "flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-500"
                  }
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-slate-300" />
                  )}
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="surface-card h-fit p-5 sm:p-6">
              <SectionHeading
                icon={WandSparkles}
                title="Customize your course"
                description="Title, story, cover image and category."
              />
              <TitleForm initialData={course} courseId={course.id} />
              <DescriptionForm initialData={course} courseId={course.id} />
              <ImageForm initialData={course} courseId={course.id} />
              <CategoryForm
                initialData={course}
                courseId={course.id}
                options={categories.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
              />
            </section>

            <div className="space-y-6">
              <section className="surface-card p-5 sm:p-6">
                <SectionHeading
                  icon={Clapperboard}
                  title="Course lessons"
                  description="Create chapters, then add video, quizzes and assignments."
                />
                <ChaptersForm initialData={course} courseId={course.id} />
              </section>
              <section className="surface-card p-5 sm:p-6">
                <SectionHeading
                  icon={Coins}
                  title="Price your course"
                  description="Set a price in ₦, or publish it as a free course."
                />
                <PriceForm initialData={course} courseId={course.id} />
              </section>
              <section className="surface-card p-5 sm:p-6">
                <SectionHeading
                  icon={Paperclip}
                  title="Resources"
                  description="Slides, templates and files your learners can download."
                />
                <AttachmentForm initialData={course} courseId={course.id} />
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseIdPage;