"use client"

import { ConfirmModal } from "@/components/modals/confirm-modal"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"

const describeError = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error) && typeof error.response?.data === "string") {
        if (/missing required fields/i.test(error.response.data)) {
            return "Add the chapter title, description and video before publishing."
        }
        return error.response.data
    }
    return fallback
}

interface ChapterActionsProps {
    disabled: boolean
    courseId: string
    chapterId: string
    isPublished: boolean
}

export const ChapterActions = ({
    disabled,
    courseId,
    chapterId,
    isPublished 
 }: ChapterActionsProps) => {

    const router = useRouter()

    const [isLoading, setIsLoading] = useState(false)

    const onClick = async () => {
        try {
            setIsLoading(true)
            if (isPublished) {
                await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/unpublish`)
                toast.success("Chapter Unpublished")
            }else {
                await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/publish`)
                toast.success("Chapter Published")
            }
            router.refresh()
        } catch (error) {
            toast.error(describeError(error, "Could not update the chapter. Please try again."))
        }finally{
            setIsLoading(false)
        }
    }

    const onDelete = async () => {
        try {
            setIsLoading(true)
            await axios.delete(`/api/courses/${courseId}/chapters/${chapterId}`)

            toast.success("Chapter deleted")
            router.push(`/teacher/courses/${courseId}`)
            router.refresh()
        } catch (error) {
            toast.error(describeError(error, "Could not delete the chapter. Please try again."))
        }finally{
            setIsLoading(false)
        }
    }
    return (
       <div className="flex items-center gap-x-2">
        <Button 
            onClick={onClick}
            disabled={disabled || isLoading}
            variant={isPublished ? "outline" : "default"}
            size="sm"
            className={isPublished ? "rounded-full" : "rounded-full bg-teal-600 text-white shadow-none hover:bg-teal-700"}
        >

            {isPublished ? "Unpublish" : "Publish"}
        </Button>
        <ConfirmModal onConfirm={onDelete}>

        <Button size="sm" variant="outline" disabled={isLoading} aria-label="Delete chapter" className="rounded-full px-2.5">
            <Trash className="h-4 w-4 text-rose-500" />
        </Button>
        </ConfirmModal>
       </div>
    )
}