"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, BookOpen, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Give your course a title to continue." })
    .max(120, { message: "Keep the title to 120 characters or fewer." }),
});

export function CourseCreateForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "" },
  });
  const title = form.watch("title");
  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setServerError(null);
    try {
      const { data } = await axios.post<{ id?: string }>("/api/courses", values);
      if (!data?.id) throw new Error("The course was created without an id.");
      toast.success("Course created. Add the details next.");
      router.push(`/teacher/courses/${data.id}`);
      router.refresh();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? typeof error.response?.data === "string"
          ? error.response.data
          : typeof error.response?.data?.error === "string"
            ? error.response.data.error
            : "Could not create the course. Please try again."
        : "Could not create the course. Please try again.";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <div className="surface-card p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-100">
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Course basics</h2>
          <p className="mt-0.5 text-sm text-slate-500">Give your course a name. You can change it at any time.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-slate-800">Course title</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    disabled={isSubmitting}
                    placeholder="e.g. Introduction to Algorithms"
                    maxLength={120}
                    className="h-11 rounded-xl border-slate-200 bg-white text-base focus-visible:border-teal-300 focus-visible:ring-teal-500/20"
                    {...field}
                  />
                </FormControl>
                <div className="flex items-start justify-between gap-3">
                  <FormDescription className="text-xs text-slate-500">
                    A clear, specific title helps the right learners find your course.
                  </FormDescription>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-medium tabular-nums",
                      title.length > 110 ? "text-amber-600" : "text-slate-400"
                    )}
                  >
                    {title.length}/120
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Preview</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {title.trim() || "Your course title"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Draft course · you choose when to publish it.</p>
          </div>

          {serverError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
              {serverError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <Link
              href="/teacher/courses"
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="gap-2 bg-teal-600 text-white shadow-none hover:-translate-y-0 hover:bg-teal-700"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isSubmitting ? "Creating course..." : "Create course"}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
