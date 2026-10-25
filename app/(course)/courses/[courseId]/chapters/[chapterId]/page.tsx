import { getChapter } from "@/actions/get-chapter";
import { Banner } from "@/components/banner";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VideoPlayer } from "./_components/video-player";
import { CourseEnrollButton } from "./_components/course-enroll-button";
import { CourseFreeEnrollButton } from "./_components/course-free-enroll-button";
import { Separator } from "@/components/ui/separator";
import { Preview } from "@/components/preview";
import { File } from "lucide-react";
import { CourseProgressButton } from "./_components/course-progress-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { ChapterActivities } from "./_components/chapter-activities";
import { ClipboardList } from "lucide-react";

const ChapterIdPage = async ({
    params
}: {
    params: {courseId: string; chapterId: string}
}) => {

    const {userId} = auth()

    const {
        chapter,
        course,
        attachments,
        nextChapter,
        userProgress,
        purchase
    } = await getChapter({
        userId: userId ?? undefined,
        chapterId: params.chapterId,
        courseId: params.courseId
    })

    if (!chapter || !course) {
        return redirect('/')
    }

    const isOwner = course.userId === userId
    const isLocked = !chapter.isFree && !purchase && !isOwner
    const isFreeCourse = course.price === 0

    const completeOnEnd = !!purchase && !userProgress?.isCompleted
    const storedActivities = await db.chapter.findUnique({
        where: { id: chapter.id },
        select: {
            quiz: {
                select: {
                    id: true,
                    title: true,
                    passPercent: true,
                    questions: {
                        orderBy: { position: "asc" },
                        select: { id: true, prompt: true, options: true, explanation: true },
                    },
                    attempts: {
                        where: { userId: userId ?? "__anonymous__" },
                        select: { score: true, total: true, passed: true },
                    },
                },
            },
            assignment: {
                select: {
                    id: true,
                    title: true,
                    instructions: true,
                    submissions: {
                        where: { userId: userId ?? "__anonymous__" },
                        select: { response: true, status: true, score: true, feedback: true, submittedAt: true },
                    },
                },
            },
        },
    });
    const hasActivities = !!storedActivities?.quiz || !!storedActivities?.assignment;
    return ( 
        <div>
           {userProgress?.isCompleted && (
            <Banner
            variant={"success"}
                label="You have completed this chapter"
            />
           )}
           {isLocked && (
            <Banner
            variant={"warning"}
                label="You need to purchase this course to watch this chapter"
            />
           )}
           <div className="flex flex-col max-w-4xl mx-auto pb-20">
            <div className="p-4">
                <VideoPlayer
                    chapterId={params.chapterId}
                    title={chapter.title}
                    courseId={params.courseId}
                    nextChapterId={nextChapter?.id}
                    videoUrl={chapter.videoUrl || undefined}
                    isLocked={isLocked}
                    completeOnEnd={completeOnEnd}
                />
            </div>
            <div>
                <div className="p-4 flex flex-col md:flex-row items-center justify-between">
                    <h2 className="text-2xl font-semibold mb-2">
                        {chapter.title}
                    </h2>
                    {purchase ? (
                        <CourseProgressButton
                        isCompleted={!!userProgress?.isCompleted}
                        nextChapterId={nextChapter?.id}
                        chapterId={chapter.id}
                        courseId={params.courseId}
                      />
                    ) : isOwner ? (
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">Instructor preview</span>
                    ) : userId ? (
                        isFreeCourse ? (
                            <CourseFreeEnrollButton courseId={params.courseId} />
                        ) : typeof course.price === "number" && course.price > 0 ? (
                            <CourseEnrollButton 
                                courseId={params.courseId}
                                price={course.price}
                            />
                        ) : null
                    ) : (
                        <Button asChild className="w-full md:w-auto">
                            <Link href={`/sign-in?redirect_url=${encodeURIComponent(`/courses/${params.courseId}`)}`}>
                                Sign in to enroll
                            </Link>
                        </Button>
                    )}
                </div>
                <Separator />
                <div>
                    <Preview value={chapter.description!} />
                </div>
                {!!attachments.length && (
                    <>
                        <Separator/>
                        <div className="p-4">
                            {attachments.map((attachment) => (
                                <a
                                href={attachment.url}
                                target="_blank" 
                                key={attachment.id}
                                className="flex items-center p-3 w-full bg-neutral-200 border text-neutral-700 rounded-md hover:underline"
                                >
                                    <File />
                                    <p className="line-clamp-1">
                                        {attachment.name}
                                    </p>
                                </a>
                            ))}
                        </div>
                    </>
                )}
            </div>
           </div>
           {purchase && storedActivities && (
             <ChapterActivities
                courseId={params.courseId}
                chapterId={params.chapterId}
                quiz={storedActivities.quiz ? {
                    id: storedActivities.quiz.id,
                    title: storedActivities.quiz.title,
                    passPercent: storedActivities.quiz.passPercent,
                    questions: storedActivities.quiz.questions,
                } : null}
                attempt={storedActivities.quiz?.attempts[0] ?? null}
                assignment={storedActivities.assignment ? {
                    id: storedActivities.assignment.id,
                    title: storedActivities.assignment.title,
                    instructions: storedActivities.assignment.instructions,
                } : null}
                submission={storedActivities.assignment?.submissions[0] ? {
                    ...storedActivities.assignment.submissions[0],
                    submittedAt: storedActivities.assignment.submissions[0].submittedAt.toISOString(),
                } : null}
             />
           )}
           {!purchase && hasActivities && (
             <section className="mx-auto mb-10 flex max-w-4xl items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-5 text-sm text-neutral-900">
                <ClipboardList className="h-5 w-5 shrink-0" />
                Enroll in this course to access its quiz and assignment activities.
             </section>
           )}
        </div>
     );
}
 
export default ChapterIdPage;
