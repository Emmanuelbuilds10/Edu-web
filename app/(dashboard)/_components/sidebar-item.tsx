"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
}

export const SidebarItem = ({ icon: Icon, label, href }: SidebarItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "mx-3 flex items-center gap-x-3 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-slate-500 transition-all hover:bg-slate-100/80 hover:text-slate-900",
        isActive && "bg-teal-50 font-semibold text-teal-900 hover:bg-teal-50 hover:text-teal-900"
      )}
    >
      <Icon size={20} className={cn("shrink-0 text-slate-400", isActive && "text-teal-600")} />
      <span className="truncate">{label}</span>
      {isActive && <span aria-hidden className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />}
    </Link>
  );
};
