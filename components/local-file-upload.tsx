"use client";

import axios from "axios";
import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export function LocalFileUpload({
  onChange,
  accept = "image/*,video/*,audio/*,application/pdf,text/plain",
  label = "Choose a file",
  compact = false,
}: {
  onChange: (url?: string) => void;
  accept?: string;
  label?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const upload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setProgress(0);
      setFileName(file.name);
      const { data } = await axios.post<{ url: string }>("/api/demo/upload", formData, {
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      onChange(data.url);
      toast.success("File uploaded");
    } catch (error) {
      const message =
        axios.isAxiosError(error) && typeof error.response?.data?.error === "string"
          ? error.response.data.error
          : "Upload failed. Please try again.";
      toast.error(message);
      onChange(undefined);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("rounded-xl border border-dashed border-neutral-300 bg-white", compact ? "p-2" : "p-4")}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={isUploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg font-semibold transition",
          compact ? "px-2 py-1.5 text-xs" : "px-4 py-3 text-sm",
          isUploading ? "cursor-wait bg-slate-100 text-slate-500" : "bg-neutral-900 text-white hover:bg-neutral-800"
        )}
      >
        <UploadCloud className="h-4 w-4" />
        {isUploading ? `Uploading ${progress}%` : label}
      </button>
      {isUploading && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-neutral-700 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {!isUploading && fileName && <p className="mt-2 truncate text-xs text-slate-500">{fileName}</p>}
    </div>
  );
}
