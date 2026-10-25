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
import { Check, Coins, Loader2, SquarePen, Tag } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Course } from "@prisma/client";
import { formatPrice } from "@/lib/format";

interface PriceFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  // An empty input coerces to 0, which means the course is free.
  price: z.coerce.number().min(0, { message: "Price cannot be negative" }),
});

export const PriceForm = ({ initialData, courseId }: PriceFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: initialData?.price ?? undefined,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success(
        values.price === 0 ? "Course set to free" : "Course Updated"
      );
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const price = initialData.price;
  const isFree = price === 0;
  const isSet = price !== null && price !== undefined;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-teal-300/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
            <Coins className="h-4 w-4" />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Course price
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!isSet ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              <Tag className="h-3.5 w-3.5" /> Not set yet
            </span>
          ) : isFree ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <Check className="h-3.5 w-3.5" /> Free course
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
              <Coins className="h-3.5 w-3.5" /> {formatPrice(price)}
            </span>
          )}
          <p className="text-xs text-slate-500">
            {isSet
              ? isFree
                ? "Learners can enrol at no cost."
                : "Learners pay this amount before enrolling."
              : "Set a price, or 0 to publish it for free."}
          </p>
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center rounded-l-xl border-r border-slate-200 bg-slate-50 text-sm font-bold text-slate-500">
                        ₦
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        disabled={isSubmitting}
                        placeholder="0"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="h-11 rounded-xl border-slate-200 bg-white pl-12 text-base font-semibold focus-visible:border-teal-300 focus-visible:ring-teal-500/20"
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-slate-500">
                    Enter <span className="font-semibold text-slate-700">0</span>{" "}
                    to publish this course for free.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() =>
                  form.setValue("price", 0, { shouldValidate: true })
                }
                className="gap-1.5 rounded-lg border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
              >
                <Tag className="h-3.5 w-3.5" /> Make it free
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="ml-auto gap-2 rounded-xl bg-teal-600 text-white shadow-none hover:bg-teal-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save price
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};