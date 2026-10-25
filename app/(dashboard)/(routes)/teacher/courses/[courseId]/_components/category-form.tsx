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

import { Button } from "@/components/ui/button";
import { Check, Loader2, Shapes, SquarePen } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Course } from "@prisma/client";
import { ComboBox } from "@/components/ui/combobox";

interface CategoryFormProps {
  initialData: Course;
  courseId: string;
  options: { label: string; value: string }[];
}

const formSchema = z.object({
  categoryId: z.string().min(1, { message: "Choose a category" }),
});

export const CategoryForm = ({
  initialData,
  courseId,
  options,
}: CategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

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

  const selectedOption = options.find(
    (option) => option.value === initialData.categoryId
  );

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-teal-300/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
            <Shapes className="h-4 w-4" />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Category
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
        <div className="mt-3">
          {selectedOption ? (
            <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
              {selectedOption.label}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              No category yet
            </span>
          )}
        </div>
      )}

      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ComboBox options={options} {...field} />
                  </FormControl>
                  <p className="text-xs text-slate-500">
                    Learners filter courses by category, so pick the closest
                    match.
                  </p>
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