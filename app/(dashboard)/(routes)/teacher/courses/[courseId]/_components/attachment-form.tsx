"use client";

import * as z from "zod";
import axios from "axios";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  CirclePlus,
  FileText,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { Attachment, Course } from "@prisma/client";
import { FileUpload } from "@/components/file-upload";

interface AttachmentFormProps {
  initialData: Course & { attachments: Attachment[] };
  courseId: string;
}

const formSchema = z.object({
  url: z.string().min(1),
});

export const AttachmentForm = ({
  initialData,
  courseId,
}: AttachmentFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/courses/${courseId}/attachments`, values);
      toast.success("Attachment added");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await axios.delete(`/api/courses/${courseId}/attachments/${id}`);
      toast.success("Attachment Deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-teal-300/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
            <Paperclip className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Resources
            </p>
            <p className="text-xs text-slate-500">
              {initialData.attachments.length}{" "}
              {initialData.attachments.length === 1 ? "file" : "files"} attached
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
          ) : (
            <>
              <CirclePlus className="h-3.5 w-3.5" />
              Add a file
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <div className="mt-3">
          {initialData.attachments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center">
              <FileText className="h-5 w-5 text-slate-400" />
              <p className="text-xs font-medium text-slate-500">
                No attachments yet
              </p>
              <p className="text-xs text-slate-400">
                Add slides, templates or cheat sheets for your learners.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {initialData.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 transition hover:border-teal-200 hover:bg-white"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-slate-500 shadow-sm">
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                    {attachment.name}
                  </p>
                  {deletingId === attachment.id ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDelete(attachment.id)}
                      aria-label={`Remove ${attachment.name}`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-rose-600 hover:shadow-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <div className="mt-4">
          <FileUpload
            endpoint="courseAttachment"
            onChange={(url) => {
              if (url) {
                onSubmit({ url: url });
              }
            }}
          />
          <p className="mt-3 text-xs text-slate-500">
            Add anything your student might need to complete the course.
          </p>
        </div>
      )}
    </div>
  );
};