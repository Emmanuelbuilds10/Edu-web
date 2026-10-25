import { hasTeacherAccess } from "@/lib/teacher";
import { auth } from "@/lib/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
 
const f = createUploadthing();

const handleUserAuth = async () => {
    const { userId } = auth()
    if (!userId) throw new Error("Unauthorized")
    return { userId }
}
 
const handleAuth = async () => {
    const {userId} = auth()
    const isAuthorized = await hasTeacherAccess(userId)
    if (!userId || !isAuthorized) throw new Error("Unauthorized")
        return {userId}
}
 
export const ourFileRouter = {
    profileAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(() => handleUserAuth())
    .onUploadComplete(({ file }) => ({ url: file.url })),
    courseImage: f({ image: {maxFileSize: '4MB', maxFileCount: 1} })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
    courseAttachment: f(["text", "image", "video", "audio", "pdf"])
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
    chapterVideo: f({video: {maxFileCount: 1, maxFileSize: "512GB"}})
    .middleware(() => handleAuth())
    .onUploadComplete(() => {})
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
