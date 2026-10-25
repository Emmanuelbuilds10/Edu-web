"use client";

import * as z from "zod";
import axios from "axios";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, SquarePen, UploadCloud } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { Course } from "@prisma/client";
import Image from "next/image";
import { FileUpload } from "@/components/file-upload";

interface ImageFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  imageUrl: z.string().min(1, {
    message: "Image is required",
  }),
});

export const ImageForm = ({ initialData, courseId }: ImageFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("Course Updated");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-teal-300/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
            <ImageIcon className="h-4 w-4" />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Cover image
          </p>
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
          ) : (
            <>
              <SquarePen className="h-3.5 w-3.5" />
              {initialData.imageUrl ? "Change" : "Add"}
            </>
          )}
        </Button>
      </div>

      {!isEditing &&
        (!initialData.imageUrl ? (
          <div className="mt-3 flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-slate-400">
            <UploadCloud className="h-8 w-8" />
            <p className="text-xs font-medium text-slate-500">
              No cover image yet
            </p>
          </div>
        ) : (
          <div className="relative mt-3 aspect-video overflow-hidden rounded-xl border border-slate-200">
            <Image
              alt="Course cover"
              fill
              className="object-cover"
              src={initialData.imageUrl}
            />
          </div>
        ))}

      {isEditing && (
        <div className="mt-4">
          <FileUpload
            endpoint="courseImage"
            onChange={(url) => {
              if (url) {
                onSubmit({ imageUrl: url });
              }
            }}
          />
          <p className="mt-3 text-xs text-slate-500">
            16:9 aspect ratio recommended · minimum 1280px wide.
          </p>
        </div>
      )}
    </div>
  );
};