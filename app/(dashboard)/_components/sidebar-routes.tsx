"use client"

import { Archive, Award, BarChart, Compass, Layout, List, MessageCircle, ShieldCheck, UserRound, Users } from "lucide-react"
import { SidebarItem } from "./sidebar-item"
import { usePathname } from "next/navigation"

const guestroutes = [
    {
        icon: Layout,
        label: "Dashboard",
        href: '/dashboard',
    },
    {
        icon: Compass,
        label: "Browse",
        href: '/search',
    },
    {
        icon: Archive,
        label: "My learning library",
        href: '/library',
    },
    {
        icon: MessageCircle,
        label: "Community forum",
        href: '/forum',
    },
    {
        icon: Award,
        label: "Achievements",
        href: '/achievements',
    },
]
const teacherRoutes = [
    {
        icon: List,
        label: "Courses",
        href: '/teacher/courses',
    },
    {
        icon: Users,
        label: "Students",
        href: '/teacher/students',
    },
    {
        icon: UserRound,
        label: "Teacher profile",
        href: '/teacher/profile',
    },
    {
        icon: BarChart,
        label: "Earnings",
        href: '/teacher/analytics',
    },
]

export const SidebarRoutes = ({ isAdmin = false }: { isAdmin?: boolean }) => {
    const pathname = usePathname()

    const isTeacherPage = pathname?.startsWith("/teacher/")
    const routes = isTeacherPage
        ? isAdmin
            ? [...teacherRoutes, { icon: ShieldCheck, label: "Accounts", href: '/teacher/users' }]
            : teacherRoutes
        : guestroutes
    return(
        <div className="flex w-full flex-col gap-1.5">
            {routes.map((route) => (
                <SidebarItem 
                    key={route.href}
                    icon={route.icon}
                    label={route.label}
                    href={route.href}
                />
            ))}
        </div>
    )
}
