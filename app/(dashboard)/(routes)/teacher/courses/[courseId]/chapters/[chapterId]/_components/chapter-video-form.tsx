"use client";

import * as z from "zod";
import axios from "axios";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CirclePlus, PlayCircle, SquarePen, UploadCloud } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { Chapter } from "@prisma/client";
import { FileUpload } from "@/components/file-upload";

interface ChapterVideoFormProps {
  initialData: Chapter;
  courseId: string;
  chapterId: string;
}

const formSchema = z.object({
  videoUrl: z.string().min(1),
});

export const ChapterVideoForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterVideoFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, values);
      toast.success("Chapter Updated");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-teal-300/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
            <PlayCircle className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Lesson video
            </p>
            <p className="text-xs text-slate-500">
              {initialData.videoUrl ? "Video uploaded" : "No video yet"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={toggleEdit}
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-700"
        >
          {isEditing ? (
            "Cancel"
          ) : initialData.videoUrl ? (
            <>
              <SquarePen className="h-3.5 w-3.5" /> Replace
            </>
          ) : (
            <>
              <CirclePlus className="h-3.5 w-3.5" /> Upload
            </>
          )}
        </Button>
      </div>

      {!isEditing &&
        (!initialData.videoUrl ? (
          <div className="mt-3 flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-slate-400">
            <UploadCloud className="h-8 w-8" />
            <p className="text-xs font-medium text-slate-500">
              Upload the video for this chapter
            </p>
          </div>
        ) : (
          <div className="relative mt-3 aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
            <video
              className="h-full w-full"
              controls
              src={initialData.videoUrl}
            />
          </div>
        ))}

      {isEditing && (
        <div className="mt-4">
          <FileUpload
            endpoint="chapterVideo"
            onChange={(url) => {
              if (url) {
                onSubmit({ videoUrl: url });
              }
            }}
          />
          <p className="mt-3 text-xs text-slate-500">
            Your video is ready to play immediately after upload.
          </p>
        </div>
      )}

      {initialData.videoUrl && !isEditing && (
        <p className="mt-3 text-xs text-slate-500">
          Your video is ready to play immediately after upload.
        </p>
      )}
    </div>
  );
};