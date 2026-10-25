"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Loader2, SquarePen, Type } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface ChapterTitleFormProps {
  initialData: {
    title: string;
  };
  courseId: string;
  chapterId: string;
}

const formSchema = z.object({
  title: z.string().min(1),
});

export const ChapterTitleForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterTitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

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
            <Type className="h-4 w-4" />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Chapter title
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
              Edit
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <p className="mt-3 break-words text-sm font-medium leading-6 text-slate-800">
          {initialData.title || (
            <span className="font-normal italic text-slate-400">
              No title yet
            </span>
          )}
        </p>
      )}

      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      autoFocus
                      disabled={isSubmitting}
                      placeholder="e.g. Getting started with the basics"
                      className="h-11 rounded-xl border-slate-200 bg-white text-base focus-visible:border-teal-300 focus-visible:ring-teal-500/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="gap-2 rounded-xl bg-teal-600 text-white shadow-none hover:bg-teal-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};