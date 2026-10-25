import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Chapter, Course, UserProgress } from "@prisma/client"
import { CourseSidebarItem } from "./course-sidebar-item"
import { CourseProgress } from "./course-progress"

interface CourseSidebarProps {
    course: Course & {
        chapters: (Chapter & {
            userProgress: UserProgress[] | null
        })[]
    }
    progressCount: number
}

export const CourseSidebar = async ({
    course,
    progressCount
}: CourseSidebarProps) => {

    const {userId} = auth()

    const purchase = userId ? await db.purchase.findUnique({
        where: {
            userId_courseId: {
                userId,
                courseId: course.id
            }
        }
    }) : null
    const isOwner = course.userId === userId
    return (
        <div className="h-full border-r flex flex-col overflow-y-auto shadow-sm">
            <div className="p-8 flex flex-col border-b">
                <h1 className="font-semibold">{course.title}</h1>
                {purchase && (
                    <div className="mt-10">
                        <CourseProgress
                            variant={"success"}
                            value={progressCount}
                        />
                    </div>
                )}
            </div>
            <div className="flex flex-col w-full">
                {course.chapters.map((chapter) => (
                    <CourseSidebarItem
                        key={chapter.id}
                        id={chapter.id}
                        label={chapter.title}
                        isCompleted={!!chapter.userProgress?.[0]?.isCompleted}
                        courseId={course.id}
                        isLocked={!chapter.isFree && !purchase && !isOwner}
                    />
                ))}
            </div>
        </div>
    )
}
