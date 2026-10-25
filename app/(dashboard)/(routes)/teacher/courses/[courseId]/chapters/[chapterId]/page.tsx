import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hasTeacherAccess } from "@/lib/teacher";
import { ArrowLeft, Eye, PenLine, PlayCircle, SquarePen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChapterTitleForm } from "./_components/chapter-title-form";
import { ChapterDescriptionForm } from "./_components/chapter-description-form";
import { ChapterAccessForm } from "./_components/chapter-access-form";
import { ChapterVideoForm } from "./_components/chapter-video-form";
import { Banner } from "@/components/banner";
import { ChapterActions } from "./_components/chapter-actions";
import { ChapterActivitiesEditor } from "./_components/chapter-activities-editor";

const SectionHeading = ({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof PenLine;
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

const ChapterIdPage = async ({
  params,
}: {
  params: { courseId: string; chapterId: string };
}) => {
  const { userId } = auth();

  if (!userId) {
    return redirect(`/sign-in?redirect_url=${encodeURIComponent(`/teacher/courses/${params.courseId}/chapters/${params.chapterId}`)}`);
  }

  if (!(await hasTeacherAccess(userId))) {
    return redirect("/teacher-mode");
  }

  const chapter = await db.chapter.findUnique({
    where: {
      id: params.chapterId,
      courseId: params.courseId,
    },
    include: {
      muxData: true,
      quiz: { include: { questions: { orderBy: { position: "asc" } } } },
      assignment: true,
    },
  });

  if (!chapter) {
    return redirect(`/teacher/courses/${params.courseId}`);
  }

  const requiredFields = [chapter.title, chapter.description, chapter.videoUrl];
  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `(${completedFields}/${totalFields})`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!chapter.isPublished && (
        <Banner
          variant="warning"
          label="This chapter is a draft. Publish it so enrolled students can open the lesson."
        />
      )}
      <div className="dashboard-canvas min-h-full p-5 md:p-8">
        <div className="w-full">
          <Link
            href={`/teacher/courses/${params.courseId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to course setup
          </Link>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="eyebrow text-teal-700">Lesson editor</p>
              <h1 className="mt-1 truncate text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Edit chapter
              </h1>
              <p className="mt-1.5 truncate text-sm text-slate-500">
                {chapter.title} · required fields {completionText}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <ChapterActions
                disabled={!isComplete}
                courseId={params.courseId}
                chapterId={params.chapterId}
                isPublished={chapter.isPublished}
              />
              {!isComplete && (
                <p className="max-w-xs text-xs leading-5 text-slate-500 sm:text-right">
                  Add a lesson title, description and video to publish this
                  chapter.
                </p>
              )}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="surface-card h-fit p-5 sm:p-6">
              <SectionHeading
                icon={SquarePen}
                title="Customize your chapter"
                description="Name it and explain what learners will take away."
              />
              <ChapterTitleForm
                initialData={chapter}
                chapterId={params.chapterId}
                courseId={params.courseId}
              />
              <ChapterDescriptionForm
                initialData={chapter}
                courseId={params.courseId}
                chapterId={params.chapterId}
              />
            </section>

            <div className="space-y-6">
              <section className="surface-card p-5 sm:p-6">
                <SectionHeading
                  icon={PlayCircle}
                  title="Lesson video"
                  description="Upload the video learners watch for this chapter."
                />
                <ChapterVideoForm
                  chapterId={params.chapterId}
                  courseId={params.courseId}
                  initialData={chapter}
                />
              </section>

              <section className="surface-card p-5 sm:p-6">
                <SectionHeading
                  icon={Eye}
                  title="Access settings"
                  description="Choose whether this lesson needs enrolment."
                />
                <ChapterAccessForm
                  initialData={chapter}
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                />
              </section>
            </div>

            <div className="lg:col-span-2">
              <ChapterActivitiesEditor
                courseId={params.courseId}
                chapterId={params.chapterId}
                initialQuiz={chapter.quiz}
                initialAssignment={chapter.assignment}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChapterIdPage;