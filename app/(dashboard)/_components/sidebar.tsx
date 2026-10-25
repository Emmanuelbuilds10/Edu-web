import { Logo } from "./logo";
import { SidebarRoutes } from "./sidebar-routes";
import { auth } from "@/lib/auth";
import { isTeacherAdmin } from "@/lib/teacher";

export const Sidebar = () => {
  const { userId } = auth();
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="px-7 pb-9 pt-7">
        <Logo />
      </div>
      <div className="flex w-full flex-col">
        <SidebarRoutes isAdmin={isTeacherAdmin(userId)} />
      </div>
      <div className="mt-auto px-5 pb-6 pt-10">
        <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-sky-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Keep going</p>
          <p className="mt-2 text-sm font-semibold leading-snug text-slate-800">Small lessons every day add up to big progress.</p>
        </div>
      </div>
    </div>
  );
};
