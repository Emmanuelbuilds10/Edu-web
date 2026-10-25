import { db } from "@/lib/db";
import { auth, clerkClient } from "@/lib/auth";
import axios from "axios";
import { ArrowLeft, BookOpen, CheckCircle2, GraduationCap, LockKeyhole, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CourseEnrollButton } from "./chapters/[chapterId]/_components/course-enroll-button";
import { CourseFreeEnrollButton } from "./chapters/[chapterId]/_components/course-free-enroll-button";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { CourseReviews, type CourseReviewItem } from "./_components/course-reviews";

interface CoursePageProps {
    params: { courseId: string };
    searchParams?: { reference?: string; trxref?: string; success?: string };
}

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
    const { userId } = auth();
    const course = await db.course.findUnique({
        where: { id: params.courseId },
        include: {
            category: true,
            chapters: {
                where: { isPublished: true },
                orderBy: { position: "asc" },
            },
        },
    });

    if (!course || (!course.isPublished && course.userId !== userId)) notFound();

    let paymentVerified = false;
    const reference = searchParams?.reference || searchParams?.trxref;
    if (reference && userId && course.price && process.env.PAYSTACK_SECRET_KEY) {
        try {
            const response = await axios.get(
                `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
                { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
            );
            const transaction = response.data?.data;
            const expectedAmount = Math.round(course.price * 100);

            if (
                response.data?.status === true &&
                transaction?.status === "success" &&
                transaction.reference === reference &&
                transaction.amount === expectedAmount &&
                transaction.currency === "NGN" &&
                transaction.metadata?.courseId === course.id &&
                transaction.metadata?.userId === userId
            ) {
                await db.purchase.upsert({
                    where: { userId_courseId: { userId, courseId: course.id } },
                    update: { amountPaidKobo: transaction.amount, currency: transaction.currency },
                    create: { userId, courseId: course.id, amountPaidKobo: transaction.amount, currency: transaction.currency },
                });
                paymentVerified = true;
            }
        } catch (error) {
            console.error("[PAYSTACK_CALLBACK_VERIFY]", error);
        }
    }

    if (paymentVerified && course.chapters[0]) {
        redirect(`/courses/${course.id}/chapters/${course.chapters[0].id}`);
    }

    const purchase = userId
        ? await db.purchase.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } })
        : null;
    const reviewSelect = { id: true, rating: true, comment: true, createdAt: true } as const;
    const [reviews, ownReview] = await Promise.all([
        db.review.findMany({
            where: { courseId: course.id },
            orderBy: { createdAt: "desc" },
            select: reviewSelect,
        }),
        userId
            ? db.review.findUnique({
                where: { userId_courseId: { userId, courseId: course.id } },
                select: reviewSelect,
            })
            : Promise.resolve(null),
    ]);

    let instructorName = "Sabiplex instructor";
    try {
        const instructor = await clerkClient().users.getUser(course.userId);
        instructorName = instructor.fullName || instructor.username || instructorName;
    } catch {
        // Keep a useful fallback if the instructor's Clerk account is unavailable.
    }

    const isOwner = course.userId === userId;
    const canWatchAll = !!purchase || isOwner;
    const hasPrice = typeof course.price === "number" && course.price > 0;
    const isFree = course.price === 0;

    return (
        <div className="min-h-full bg-slate-50 px-5 py-8 md:px-8 md:py-12">
            <div className="mx-auto max-w-6xl">
                <Link href="/search" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-neutral-600">
                    <ArrowLeft className="h-4 w-4" /> Browse courses
                </Link>

                {searchParams?.success === "1" && !paymentVerified && !purchase && (
                    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                        We could not confirm this payment yet. If you completed checkout, refresh in a moment or contact support with your Paystack reference.
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                    <div className="space-y-8">
                        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="relative aspect-[16/8] bg-gradient-to-br from-neutral-700 via-neutral-700 to-slate-950">
                                {course.imageUrl && (
                                    <Image src={course.imageUrl} alt={course.title} fill unoptimized className="object-cover" priority />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9">
                                    {course.category && <span className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">{course.category.name}</span>}
                                    <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{course.title}</h1>
                                </div>
                            </div>
                            <div className="p-6 sm:p-9">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                                    <Link href={`/teachers/${course.userId}`} className="inline-flex items-center gap-2 hover:text-slate-950"><GraduationCap className="h-4 w-4 text-neutral-600" /> {instructorName}<span className="text-xs underline underline-offset-4">View profile</span></Link>
                                    <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-neutral-600" /> {course.chapters.length} {course.chapters.length === 1 ? "chapter" : "chapters"}</span>
                                    {purchase && <span className="inline-flex items-center gap-2 font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Enrolled</span>}
                                    {!purchase && isOwner && <span className="inline-flex items-center gap-2 font-semibold text-neutral-700"><PlayCircle className="h-4 w-4" /> Instructor preview</span>}
                                </div>
                                <div className="mt-7">
                                    <h2 className="text-xl font-bold text-slate-900">About this course</h2>
                                    <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{course.description || "Course details will be added soon."}</p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <div className="flex items-end justify-between gap-4">
                                <div><p className="eyebrow">Learning path</p><h2 className="mt-1 text-2xl font-black text-slate-900">Course curriculum</h2></div>
                                <span className="text-sm text-slate-500">{course.chapters.length} lessons</span>
                            </div>
                            <div className="mt-6 divide-y divide-slate-100">
                                {course.chapters.map((chapter, index) => {
                                    const canOpen = canWatchAll || chapter.isFree;
                                    const ChapterRow = (
                                        <div className={`flex items-center gap-4 py-4 ${canOpen ? "" : "opacity-75"}`}>
                                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neutral-50 text-sm font-bold text-neutral-700">{String(index + 1).padStart(2, "0")}</span>
                                            <span className="min-w-0 flex-1"><span className="block font-semibold text-slate-800">{chapter.title}</span><span className="mt-1 block text-xs text-slate-500">{chapter.isFree ? "Free preview" : "Course lesson"}</span></span>
                                            {chapter.isFree ? <PlayCircle className="h-5 w-5 shrink-0 text-neutral-600" /> : canOpen ? <PlayCircle className="h-5 w-5 shrink-0 text-slate-400" /> : <LockKeyhole className="h-5 w-5 shrink-0 text-slate-400" />}
                                        </div>
                                    );

                                    return canOpen ? (
                                        <Link key={chapter.id} href={`/courses/${course.id}/chapters/${chapter.id}`} className="block transition hover:bg-neutral-50/50">
                                            {ChapterRow}
                                        </Link>
                                    ) : (
                                        <div key={chapter.id}>{ChapterRow}</div>
                                    );
                                })}
                                {course.chapters.length === 0 && <p className="py-8 text-sm text-slate-500">The instructor is preparing the lessons for this course.</p>}
                            </div>
                        </section>

                        {(purchase || course.userId === userId) && (
                            <section className="flex flex-col gap-4 rounded-3xl border border-neutral-100 bg-neutral-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                                <div>
                                    <p className="text-sm font-semibold text-neutral-700">Learning together</p>
                                    <h2 className="mt-1 text-xl font-bold text-slate-900">Questions about this course?</h2>
                                    <p className="mt-1 text-sm text-slate-600">Ask the instructor and learn with other students.</p>
                                </div>
                                <Button asChild className="shrink-0"><Link href={`/courses/${course.id}/qa`}>Open course Q&amp;A</Link></Button>
                            </section>
                        )}

                        <CourseReviews
                            courseId={course.id}
                            reviews={reviews.map((review): CourseReviewItem => ({ ...review, createdAt: review.createdAt.toISOString() }))}
                            ownReview={ownReview ? { ...ownReview, createdAt: ownReview.createdAt.toISOString() } : null}
                            canReview={!!purchase}
                        />
                    </div>

                    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 lg:sticky lg:top-8">
                        <p className="text-sm font-semibold text-slate-500">Course access</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">{hasPrice ? formatPrice(course.price!) : isFree ? "Free" : "Price coming soon"}</p>
                        <div className="mt-6">
                            {purchase && course.chapters[0] ? (
                                <Button asChild className="w-full"><Link href={`/courses/${course.id}/chapters/${course.chapters[0].id}`}>Continue course</Link></Button>
                            ) : purchase ? (
                                <Button disabled className="w-full">Course coming soon</Button>
                            ) : isOwner && course.chapters[0] ? (
                                <Button asChild className="w-full"><Link href={`/courses/${course.id}/chapters/${course.chapters[0].id}`}>Preview your course</Link></Button>
                            ) : isOwner ? (
                                <Button asChild className="w-full" variant="outline"><Link href={`/teacher/courses/${course.id}`}>Add your first lesson</Link></Button>
                            ) : !userId ? (
                                <Button asChild className="w-full"><Link href={`/sign-in?redirect_url=${encodeURIComponent(`/courses/${course.id}`)}`}>Sign in to enroll</Link></Button>
                            ) : isFree ? (
                                <CourseFreeEnrollButton courseId={course.id} />
                            ) : hasPrice ? (
                                <CourseEnrollButton courseId={course.id} price={course.price!} />
                            ) : (
                                <Button disabled className="w-full">Enrollment unavailable</Button>
                            )}
                        </div>
                        <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                            {course.chapters.filter((chapter) => chapter.isFree).length} free preview lessons | Learn at your own pace
                        </p>
                        {isFree && !purchase && (
                            <p className="mt-2 text-center text-xs font-semibold text-emerald-700">This course is free. Enrol to unlock every lesson.</p>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
