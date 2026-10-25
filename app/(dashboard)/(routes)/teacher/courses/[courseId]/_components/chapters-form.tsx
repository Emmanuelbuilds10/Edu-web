"use client";

import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CirclePlus, Clapperboard, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Chapter, Course } from "@prisma/client";
import { ChaptersList } from "./chapters-list";

interface ChaptersFormProps {
  initialData: Course & { chapters: Chapter[] };
  courseId: string;
}

export const ChaptersForm = ({ initialData, courseId }: ChaptersFormProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const router = useRouter();

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);

      await axios.put(`/api/courses/${courseId}/chapters/reorder`, {
        list: updateData,
      });
      toast.success("Chapter order saved");
      router.refresh();
    } catch (error) {
      toast.error("Could not save the new order");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id: string) => {
    router.push(`/teacher/courses/${courseId}/chapters/${id}`);
  };

  const lessonCount = initialData.chapters.length;
  const newLessonHref = `/teacher/courses/${courseId}/chapters/new`;

  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {isUpdating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/70 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-200/70 text-slate-600">
            <Clapperboard className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Lessons
            </p>
            <p className="text-xs text-slate-500">
              {lessonCount} {lessonCount === 1 ? "chapter" : "chapters"} in this
              course
            </p>
          </div>
        </div>
        <Button
          type="button"
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg border-teal-200 bg-teal-50 text-xs font-semibold text-teal-700 hover:border-teal-300 hover:bg-teal-100 hover:text-teal-800"
        >
          <Link href={newLessonHref}>
            <CirclePlus className="h-3.5 w-3.5" /> Add a lesson
          </Link>
        </Button>
      </div>

      <div className="p-4">
        <ChaptersList
          onEdit={onEdit}
          onReorder={onReorder}
          items={initialData.chapters || []}
        />
        {lessonCount > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Drag the handle to reorder lessons. Select Edit to change a
            lesson&apos;s title, description, video or access.
          </p>
        )}
      </div>
    </div>
  );
};