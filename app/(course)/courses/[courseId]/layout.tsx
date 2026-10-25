import { getProgress } from "@/actions/get-progress"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CourseSidebar } from "./_components/course-sidebar"
import { CourseNavbar } from "./_components/course-navbar"

const CourseLayout = async ({
    children,
    params
}: {
    children: React.ReactNode
    params: {courseId: string}
}) => {

    const {userId} = auth()

    const course = await db.course.findUnique({
        where: {
            id: params.courseId,
        },
        include: {
            chapters: {
                where: {
                    isPublished: true,
                },
                include: {
                    userProgress: {
                        where: {
                            userId: userId ?? "__anonymous__"
                        }
                    }
                },
                orderBy: {
                    position: "asc"
                }
            }
        }
    })

    if (!course) {
        return redirect("/")
    }

    const progressCount = userId ? await getProgress(userId, course.id) : 0

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="fixed inset-x-0 top-0 z-40 h-[76px] md:left-80 print:hidden">
                <CourseNavbar
                    course={course}
                    progressCount={progressCount}
                />
            </header>
            <aside className="fixed inset-y-0 left-0 z-50 hidden w-80 md:block print:hidden">
                <CourseSidebar
                    course={course}
                    progressCount={progressCount}
                />
            </aside>
            <main className="min-h-screen pt-[76px] md:pl-80 print:pl-0 print:pt-0">

            {children}
            </main>
        </div>
    )
}

export default CourseLayout
