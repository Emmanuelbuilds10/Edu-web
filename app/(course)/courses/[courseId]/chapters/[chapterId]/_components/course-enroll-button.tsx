"use client"

import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import axios from "axios"
import { useState } from "react"
import toast from "react-hot-toast"

interface CourseEnrollButtonProps {
    price: number
    courseId: string
}

export const CourseEnrollButton = ({
    price,
    courseId
}: CourseEnrollButtonProps) => {
    const [isLoading, setIsLoading ] = useState(false)

    const onClick = async () => {
        try {
            setIsLoading(true)
            const response = await axios.post(`/api/courses/${courseId}/checkout`)

            if (response.data?.demo) {
                toast.success("Test payment complete — you are enrolled")
            }
            window.location.assign(response.data.url)
        } catch (error) {
            const message = axios.isAxiosError(error) && typeof error.response?.data === "string"
                ? error.response.data
                : "Could not start checkout. Please try again."
            toast.error(message)
        }finally{
            setIsLoading(false)
        }
    }
    return (
        <Button
        onClick={onClick}
        disabled={isLoading}
            className="w-full md:w-auto"
            size={"sm"}
        >
            Enroll for {formatPrice(price)}
        </Button>
    )
}
