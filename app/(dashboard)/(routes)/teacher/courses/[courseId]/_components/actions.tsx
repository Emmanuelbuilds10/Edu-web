"use client"

import { ConfirmModal } from "@/components/modals/confirm-modal"
import { Button } from "@/components/ui/button"
import { useConfettiStore } from "@/hooks/use-confetti-store"
import axios from "axios"
import { Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"

const describeError = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error) && typeof error.response?.data === "string") {
        if (/missing required fields/i.test(error.response.data)) {
            return "Complete the required course fields before publishing."
        }
        return error.response.data
    }
    return fallback
}

interface ActionsProps {
    disabled: boolean
    courseId: string
    isPublished: boolean
}

export const Actions = ({
    disabled,
    courseId,
    isPublished 
 }: ActionsProps) => {

    const router = useRouter()
    const confetti = useConfettiStore()

    const [isLoading, setIsLoading] = useState(false)

    const onClick = async () => {
        try {
            setIsLoading(true)
            if (isPublished) {
                await axios.patch(`/api/courses/${courseId}/unpublish`)
                toast.success("Course Unpublished")
            }else {
                await axios.patch(`/api/courses/${courseId}/publish`)
                toast.success("Course Published")
                confetti.onOpen()
            }
            router.refresh()
        } catch (error) {
            toast.error(describeError(error, "Could not update the course. Please try again."))
        }finally{
            setIsLoading(false)
        }
    }

    const onDelete = async () => {
        try {
            setIsLoading(true)
            await axios.delete(`/api/courses/${courseId}`)

            toast.success("Course Deleted")
            router.refresh()
            router.push(`/teacher/courses`)
        } catch (error) {
            toast.error(describeError(error, "Could not delete the course. Please try again."))
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

        <Button size="sm" variant="outline" disabled={isLoading} className="rounded-full px-2.5">
            <Trash className="h-4 w-4 text-rose-500" />
        </Button>
        </ConfirmModal>
       </div>
    )
}