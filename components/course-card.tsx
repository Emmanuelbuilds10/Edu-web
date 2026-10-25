"use client";

import Image from "next/image";
import Link from "next/link";
import { IconBadge } from "@/components/icon-badge";
import { Award, BookOpen, Star } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { CourseProgress } from "@/components/course-progress";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl: string;
  chaptersLength: number;
  price: number;
  progress: number | null;
  category: string;
  ratingAverage?: number | null;
  reviewCount?: number;
}

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  price,
  progress,
  category,
  ratingAverage,
  reviewCount = 0,
}: CourseCardProps) => {
  return (
    <div className="h-full">
      <Link href={`/courses/${id}`} passHref>
      <div
        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-neutral-200 hover:shadow-xl hover:shadow-neutral-100/60"
      >
        <div className="relative w-full aspect-video rounded-md overflow-hidden">
          <Image
            fill
          className="object-cover transition duration-500 group-hover:scale-105"
            alt={title}
            src={imageUrl}
          />
        </div>
        <div className="flex flex-col px-1 pt-4">
          <div className="text-lg font-bold leading-snug group-hover:text-neutral-600 transition line-clamp-2">
            {title}
          </div>
          <p className="mt-1 text-xs font-medium capitalize text-neutral-600">{category}</p>
          {ratingAverage && ratingAverage > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-600">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{ratingAverage.toFixed(1)}</span>
              <span className="font-normal text-slate-400">({reviewCount})</span>
            </div>
          )}
          <div className="my-3 flex items-center gap-x-2 text-sm md:text-xs">
            <div className="flex items-center gap-x-1 text-slate-500">
              <IconBadge size={"sm"} icon={BookOpen} />
              <span>
                {chaptersLength} {chaptersLength === 1 ? "Chapter" : "Chapters"}
              </span>
            </div>
          </div>
          {progress !== null ? (
            <CourseProgress 
            variant={progress === 100 ? "success" : "default"}
              size="sm"
              value={progress}
            />
          ) : (
            <p className="text-md font-bold text-slate-800">
              {formatPrice(price)}
            </p>
          )}
        </div>
      </div>
      </Link>
      {progress === 100 && (
        <Link
          href={`/certificates/${id}`}
          className="mx-3 mt-2 flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          <Award className="h-4 w-4" />
          View certificate
        </Link>
      )}
    </div>
  );
};
