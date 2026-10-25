import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function PageHeadingSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className={cn("h-9", wide ? "w-80" : "w-64")} />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}

export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <Skeleton className="aspect-video w-full" />
          <div className="space-y-3 p-2 pt-4">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CoursesPageSkeleton() {
  return (
    <div className="page-shell min-h-full p-5 md:p-8">
      <div className="w-full space-y-7">
        <PageHeadingSkeleton wide />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <CourseGridSkeleton />
      </div>
    </div>
  );
}

export function SearchPageSkeleton() {
  return (
    <div className="page-shell min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
        <PageHeadingSkeleton />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <CourseGridSkeleton />
      </div>
    </div>
  );
}

export function TeacherPageSkeleton() {
  return (
    <div className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageHeadingSkeleton />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function CoursePageSkeleton() {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 p-5 md:p-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Skeleton className="h-8 w-3/5" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
