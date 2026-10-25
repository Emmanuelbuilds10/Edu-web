"use client";

import toast from "react-hot-toast";
import { UploadButton } from "@/lib/uploadthing";
import { LocalFileUpload } from "@/components/local-file-upload";
import { useUploadMode } from "@/components/providers/upload-mode-provider";

export function AvatarUpload({
  onUploaded,
  label = "Upload photo",
}: {
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const uploadMode = useUploadMode();

  if (uploadMode === "local") {
    return <LocalFileUpload accept="image/*" label={label} onChange={(url) => url && onUploaded(url)} compact />;
  }

  return (
    <UploadButton
      endpoint="profileAvatar"
      onClientUploadComplete={(files) => {
        if (files?.[0]?.url) onUploaded(files[0].url);
      }}
      onUploadError={(error) => {
        toast.error(error.message);
      }}
      appearance={{ button: "bg-neutral-900 text-white", allowedContent: "text-xs text-slate-500" }}
    />
  );
}
