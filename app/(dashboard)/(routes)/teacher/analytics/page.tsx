import { getAnalytics } from "@/actions/get-analytics";
import { auth } from "@/lib/auth";
import { hasTeacherAccess } from "@/lib/teacher";
import { redirect } from "next/navigation";
import { DataCard } from "./_components/data-card";
import Chart from "./_components/chart";

const AnalyticsPage = async () => {
  const { userId } = auth();

  if (!userId) {
    return redirect(`/sign-in?redirect_url=${encodeURIComponent("/teacher/analytics")}`);
  }

  if (!(await hasTeacherAccess(userId))) {
    return redirect("/teacher-mode");
  }
  const { data, totalRevenue, totalSales, unrecordedSales } = await getAnalytics(userId);
  return (
    <div className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
        <div>
          <p className="eyebrow text-teal-700">Teacher studio</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Earnings</h1>
          <p className="mt-1.5 text-sm text-slate-500">Confirmed Paystack course payments and sales.</p>
        </div>
      <div className="surface-card p-4 md:p-6">
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <DataCard value={totalSales} label="Total Enrollments" />
          <DataCard value={totalRevenue} label="Recorded gross revenue" shouldFormat />
          <DataCard value={unrecordedSales} label="Older sales without payment record" />
        </div>
        <p className="mb-4 text-xs leading-5 text-slate-500">Revenue shows the confirmed amount received by the platform. Older purchases without a recorded Paystack amount are excluded. Teacher payouts are not processed from this dashboard.</p>
        <Chart data={data} />
      </div></div>
    </div>
  );
};

export default AnalyticsPage;
