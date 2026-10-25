"use client"

import { UploadDropzone } from "@/lib/uploadthing"
import { ourFileRouter } from "@/app/api/uploadthing/core"
import toast from "react-hot-toast"
import { useUploadMode } from "@/components/providers/upload-mode-provider"
import { LocalFileUpload } from "@/components/local-file-upload"

interface FileUploadProps {
    onChange: (url?: string) => void
    endpoint: keyof typeof ourFileRouter
}

const acceptByEndpoint: Partial<Record<keyof typeof ourFileRouter, string>> = {
    courseImage: "image/*",
    profileAvatar: "image/*",
    chapterVideo: "video/*",
}

export const FileUpload = ({
    onChange,
    endpoint
}: FileUploadProps) => {
    const uploadMode = useUploadMode()

    if (uploadMode === "local") {
        return (
            <div>
                <LocalFileUpload
                    onChange={onChange}
                    accept={acceptByEndpoint[endpoint] ?? "image/*,video/*,audio/*,application/pdf,text/plain"}
                    label={endpoint === "chapterVideo" ? "Upload lesson video" : "Upload file"}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                    Files are stored in <code>public/uploads</code> while Uploadthing is not configured.
                </p>
            </div>
        )
    }

    return (
        <UploadDropzone 
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
                onChange(res?.[0].url)
            }}
            onUploadError={(error: Error) => {
                toast.error(`${error?.message}`)
            }}
        />
    )
}
