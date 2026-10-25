"use client"

import { Chapter } from "@prisma/client"
import { useEffect, useState } from "react";

import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult
} from "@hello-pangea/dnd"

import { cn } from "@/lib/utils";
import { Grip, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChaptersListProps {
    items: Chapter[]
    onReorder: (updateData:{id: string; position: number} []) => void
    onEdit: (id: string) => void
}

export const ChaptersList = ({
    items,
    onReorder,
    onEdit
}: ChaptersListProps) => {

    const [isMounted, setIsMounted] = useState(false)
    const [chapters, setChapters] = useState(items)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        setChapters(items)
    }, [items])

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(chapters)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        const startIndex = Math.min(result.source.index, result.destination.index)
        const endIndex = Math.max(result.source.index, result.destination.index)

        const updatedChapters = items.slice(startIndex, endIndex + 1)

        setChapters(items)

        const bulkUpdateData = updatedChapters.map((chapter) => ({
            id: chapter.id,
            position: items.findIndex((item) => item.id === chapter.id)
        }))

        onReorder(bulkUpdateData)
    }

    if (!isMounted){
        return <p className="mt-3 text-sm text-slate-500">Loading chapters...</p>
    }

    if (!chapters.length) {
        return (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">No chapters yet</p>
                <p className="mt-1 text-xs text-slate-500">Use “Add a chapter” to create your first lesson.</p>
            </div>
        )
    }

    return (
       <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="chapters">
            {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="mt-3 space-y-2">
                    {chapters.map((chapter, index) => (
                        <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                            {(provided, snapshot) => (
                                <div className={cn(
                                    "group flex items-center gap-3 rounded-xl border border-slate-200 bg-white pr-2 text-sm text-slate-700 shadow-sm",
                                    chapter.isPublished && "border-neutral-200",
                                    snapshot.isDragging && "shadow-lg ring-2 ring-neutral-200"
                                )}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                >
                                    <div className={cn(
                                        "flex shrink-0 cursor-grab items-center self-stretch rounded-l-xl border-r border-slate-100 px-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600",
                                        snapshot.isDragging && "cursor-grabbing"
                                    )}
                                    {...provided.dragHandleProps}
                                    aria-label={`Reorder ${chapter.title}`}
                                    title="Drag to reorder"
                                    >
                                        <Grip className="h-4 w-4"/>
                                    </div>

                                    <div className="min-w-0 flex-1 py-3">
                                        <p className="truncate font-semibold text-slate-800">
                                            <span className="mr-2 text-xs font-bold text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                                            {chapter.title}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                            {chapter.isFree && <Badge variant="secondary" className="px-2 py-0 text-[10px]">Free preview</Badge>}
                                            <Badge className={cn(
                                                "px-2 py-0 text-[10px]",
                                                chapter.isPublished ? "bg-neutral-700" : "bg-slate-400"
                                            )}>
                                                {chapter.isPublished ? "Published" : "Draft"}
                                            </Badge>
                                            <span className="text-[10px] text-slate-400">position {chapter.position}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onEdit(chapter.id)}
                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-2 text-xs font-semibold text-neutral-700 transition hover:border-slate-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                                        aria-label={`Edit ${chapter.title}`}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Edit</span>
                                    </button>
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
       </DragDropContext>
    )
}
