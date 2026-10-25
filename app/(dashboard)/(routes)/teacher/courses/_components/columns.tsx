"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Course } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Pencil } from "lucide-react"
import Link from "next/link"



export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "title",
    header: ({column}) => {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Title
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        )
    },
  },
  {
    accessorKey: "price",
    header: ({column}) => {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Price
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        )
    },
    cell: ({row}) => {
        const price = row.getValue("price") as number | null
        if (price === null || price === undefined) {
            return <span className="text-slate-400">Not set</span>
        }
        if (price === 0) {
            return <span className="font-medium text-emerald-700">Free</span>
        }
        const formatted = new Intl.NumberFormat("en-us", {
            style: "currency",
            currency: "NGN",
            currencyDisplay: "narrowSymbol"
        }).format(price)

        return <div className="font-medium text-slate-700">{formatted}</div>
    }
  },
  {
    accessorKey: "isPublished",
    header: ({column}) => {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Published
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        )
    },
    cell: ({row}) => {
        const isPublished = row.getValue("isPublished") || false

        return (
            <Badge className={cn(
                "border border-slate-200 bg-slate-100 font-semibold text-slate-600 hover:bg-slate-100",
                isPublished && "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
            )}>
                {isPublished ? "Published" : "Draft"}
            </Badge>
        )
    }
  },
  {
    id: "actions",
    cell: ({row}) => {
        const {id} = row.original

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-4 w-8 p-0">
                        <span className="sr-only">Open Menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <Link href={`/teacher/courses/${id}`}>
                        <DropdownMenuItem className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit course
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
  }
]
