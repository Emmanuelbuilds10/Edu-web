import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { notifyTeacherFollowers } from "@/lib/notifications";



export async function PATCH(
    req: Request,
    { params }: { params: { courseId: string; } }
) {
    try {
        const { userId } = auth();
        if (!userId) {
          return new NextResponse("Unauthorized", { status: 401 });
        }

        const course = await db.course.findUnique({
            where: {
              id: params.courseId,
              userId,
            },
            include: {
                chapters: {
                    include: {
                        muxData: true
                    }
                }
            }
          });
          if (!course) {
            return new NextResponse("Not found", { status: 404 });
          }

          const hasPublishedChapter = course.chapters.some((chapter) => chapter.isPublished)

          if (
            !hasPublishedChapter ||
            !course.title ||
            !course.description ||
            !course.imageUrl ||
            !course.categoryId
          ) {
            return new NextResponse("Missing Required Fields", { status: 400 });
          }

          const wasPublished = course.isPublished;
          const publishedCourse = await db.course.update({
            where: {
              id: params.courseId,
              userId,
            },
            data: {
              isPublished: true,
            },
          });
          if (!wasPublished) {
            await notifyTeacherFollowers({ teacherId: userId, message: `published a new course: “${publishedCourse.title}”`, href: `/courses/${publishedCourse.id}` });
          }
          return NextResponse.json(publishedCourse);
    } catch (error) {
        console.log("[COURSE_ID_PUBLISH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
