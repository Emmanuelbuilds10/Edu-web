"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

import { UserButton, useAuth } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { NavbarSearch } from "./navbar-search";
import { NotificationBell } from "./notification-bell";

function headingFor(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/search") return "Browse";
  if (pathname === "/library") return "My library";
  if (pathname === "/forum") return "Community";
  if (pathname === "/achievements") return "Achievements";
  if (pathname === "/profile") return "My profile";
  if (pathname === "/teacher-mode") return "Teach on Sabiplex";
  if (pathname === "/teacher/create") return "New course";
  if (pathname === "/teacher/courses") return "Your courses";
  if (pathname === "/teacher/students") return "Students";
  if (pathname === "/teacher/users") return "Accounts";
  if (pathname === "/teacher/analytics") return "Earnings";
  if (pathname === "/teacher/profile") return "Teacher profile";
  if (/^\/teacher\/courses\/[^/]+$/.test(pathname)) return "Course setup";
  if (/^\/teacher\/courses\/[^/]+\/chapters\/[^/]+$/.test(pathname)) return "Lesson editor";
  if (pathname.startsWith("/courses/")) return "Course";
  if (pathname.startsWith("/teachers/")) return "Teacher";
  return "Sabiplex";
}

export function NavbarRoutes() {
  const pathname = usePathname() ?? "";
  const { userId } = useAuth();
  const isTeacherPage = pathname.startsWith("/teacher/");
  const isCoursePage = pathname.startsWith("/courses/") || pathname.startsWith("/teachers/");

  const modeHref = isTeacherPage || isCoursePage ? "/dashboard" : "/teacher-mode";
  const modeLabel = isTeacherPage ? "Learner mode" : isCoursePage ? "Dashboard" : "Teach on Sabiplex";

  return (
    <>
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{headingFor(pathname)}</p>
      </div>

      <div className="ml-auto flex items-center gap-1.5 md:gap-2">
        <Suspense fallback={<span className="hidden h-10 w-40 rounded-full bg-slate-100 md:block lg:w-64 xl:w-80" />}>
          <NavbarSearch className="hidden w-40 md:block lg:w-64 xl:w-80" />
        </Suspense>
        <Link
          href="/search"
          aria-label="Search courses"
          className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 md:hidden"
        >
          <Search className="h-4 w-4" />
        </Link>
        {userId && (
          <Link href={modeHref} className="hidden lg:block">
            <Button size="sm" variant="ghost">
              {modeLabel}
            </Button>
          </Link>
        )}
        {userId && <NotificationBell />}
        <UserButton afterSignOutUrl="/" />
      </div>
    </>
  );
}
