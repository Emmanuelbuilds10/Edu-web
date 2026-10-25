"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle, Lock, PlayCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface CourseSidebarItemProps {
  label: string;
  id: string;
  isCompleted: boolean;
  courseId: string;
  isLocked: boolean;
}

export const CourseSidebarItem = ({
  label,
  id,
  isCompleted,
  courseId,
  isLocked,
}: CourseSidebarItemProps) => {
  const pathname = usePathname();
  const Icon = isLocked ? Lock : isCompleted ? CheckCircle : PlayCircle;
  const isActive = pathname?.includes(id);

  return (
    <Link
      href={`/courses/${courseId}/chapters/${id}`}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-x-2 pl-6 text-sm font-[500] text-slate-500 transition-all hover:bg-slate-200/30 hover:text-slate-700",
        isActive && "bg-slate-200/40 text-slate-800 hover:bg-slate-200/40 hover:text-slate-800",
        isCompleted && "text-emerald-700 hover:text-emerald-700",
        isCompleted && isActive && "bg-emerald-200/25"
      )}
    >
      <div className="flex items-center gap-x-2 py-4 pr-4">
        <Icon
          size={20}
          className={cn("shrink-0 text-slate-500", isActive && "text-slate-700", isCompleted && "text-emerald-700")}
        />
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1 bg-transparent transition-all",
          isActive && "bg-slate-700",
          isCompleted && "bg-emerald-700"
        )}
      />
    </Link>
  );
};
