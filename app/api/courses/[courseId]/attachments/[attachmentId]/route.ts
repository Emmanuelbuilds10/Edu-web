import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function DELETE (
    req: Request,
    {params}: {params: {courseId: string, attachmentId: string}}
){
    try {
        const {userId} = auth()

        if (!userId){
            return new NextResponse("UnAuthorized", {status: 401})
        }

        const courseOwner = await db.course.findUnique({
            where: {
                id: params.courseId,
                userId: userId
            }
        })

        if (!courseOwner){
            return new NextResponse("UnAuthorized", {status: 401})
        }

        const attachment = await db.attachment.findFirst({
            where: {
                courseId: params.courseId,
                id: params.attachmentId,
            }
        })

        if (!attachment) {
            return new NextResponse("Not Found", {status: 404})
        }

        await db.attachment.delete({
            where: {
                id: attachment.id,
            }
        })

        return NextResponse.json(attachment)
    } catch (error) {
        console.log("ATTACHMENT_ID", error)
        return new NextResponse("Internal Error", {status: 500})
    }
}
