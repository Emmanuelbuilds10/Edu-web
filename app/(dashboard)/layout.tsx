import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");
  const profile = await db.userProfile.findUnique({ where: { userId }, select: { id: true, displayName: true } });
  if (!profile) redirect("/profile/setup");
  if (!profile.displayName) redirect("/profile/setup/display-name");

  return (
    <div className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-40 h-[76px] md:left-64 print:hidden">
        <Navbar />
      </header>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 md:block print:hidden">
        <Sidebar />
      </aside>
      <main className="min-h-screen pt-[76px] md:pl-64 print:pl-0 print:pt-0">{children}</main>
    </div>
  );
};

export default DashboardLayout;
