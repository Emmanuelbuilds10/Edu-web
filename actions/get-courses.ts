import { getProgress } from "@/actions/get-progress";
import { db } from "@/lib/db";
import { Category, Course } from "@prisma/client";

type CourseWithProgressWithCategory = Course & {
    category: Category | null
    chapters: {id: string} []
    progress: number|null
    purchases: { id: string }[]
    reviews: {rating: number}[]
}

type GetCourses = {
    userId?: string
    title?: string
    categoryId?: string
    categoryIds?: string[]
}

export const getCourses = async ({
    userId,
    title,
    categoryId,
    categoryIds,
}: GetCourses): Promise<CourseWithProgressWithCategory[]> => {
    try {
        const courses = await db.course.findMany({
            where: {
                isPublished: true,
                categoryId: categoryIds?.length
                    ? { in: categoryIds }
                    : categoryId ? { equals: categoryId } : undefined,
            },
            include: {
                category: true,
                chapters: {
                    where: {
                        isPublished: true
                    },
                    select: {
                        id: true
                    }
                },
                purchases: {
                    where: { userId: userId ?? "__anonymous__" }
                },
                reviews: { select: { rating: true } }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        // Match titles here instead of in the database so search is
        // case-insensitive on every supported database (MongoDB `contains`
        // is case-sensitive and has no `mode: "insensitive"`).
        const normalizedTitle = title?.trim().toLocaleLowerCase()
        const matchingCourses = normalizedTitle
            ? courses.filter(course => course.title.toLocaleLowerCase().includes(normalizedTitle))
            : courses

        const courseWithProgress: CourseWithProgressWithCategory[] = await Promise.all(
            matchingCourses.map(async course => {
                if (!userId || course.purchases.length === 0) {
                    return {
                        ...course,
                        progress: null
                    }
                }
                const progressPercentage = await getProgress(userId, course.id)

                return {
                    ...course,
                    progress: progressPercentage
                }
            })
        )
        return courseWithProgress
    } catch (error) {
        console.log("GET_COURSES", error)
        return []
    }
}
