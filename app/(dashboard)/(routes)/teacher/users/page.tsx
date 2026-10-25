import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isTeacherAdmin } from "@/lib/teacher";
import { listAccounts } from "@/lib/accounts";
import { UserRoleManager } from "./_components/user-role-manager";

export default async function AccountsPage() {
  const { userId } = auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent("/teacher/users")}`);
  if (!isTeacherAdmin(userId)) redirect("/teacher-mode");

  const accounts = await listAccounts();

  return (
    <div className="dashboard-canvas min-h-full p-5 md:p-8">
      <div className="w-full space-y-6">
        <div>
          <p className="eyebrow text-teal-700">Administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">User accounts</h1>
          <p className="mt-1.5 max-w-3xl text-sm text-slate-500">
            Review every account and decide who can create and publish courses. Administrator access is controlled by your
            deployment settings.
          </p>
        </div>
        <UserRoleManager initialAccounts={accounts} />
      </div>
    </div>
  );
}
