import { Skeleton } from "@/components/skeletons";

export default function DashboardPageLoading() {
  return (
    <div className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-52 rounded-full" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[132px] w-full rounded-2xl" />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-12 xl:gap-5">
          <Skeleton className="h-[360px] w-full rounded-2xl xl:col-span-6" />
          <Skeleton className="h-[360px] w-full rounded-2xl xl:col-span-3" />
          <Skeleton className="h-[360px] w-full rounded-2xl xl:col-span-3" />
        </div>

        <div className="grid gap-4 xl:grid-cols-12 xl:gap-5">
          <Skeleton className="h-[286px] w-full rounded-2xl xl:col-span-4" />
          <Skeleton className="h-[286px] w-full rounded-2xl xl:col-span-4" />
          <Skeleton className="h-[286px] w-full rounded-2xl xl:col-span-4" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-7 w-40" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <Skeleton className="aspect-video w-full" />
                <div className="space-y-3 p-2 pt-4">
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
