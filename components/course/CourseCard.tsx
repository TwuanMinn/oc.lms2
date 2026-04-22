"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDuration } from "@/lib/utils";
import { ProgressRing } from "./ProgressRing";
import { RatingStars } from "./RatingStars";
import { CategoryBadge } from "./CategoryBadge";
import { motion } from "motion/react";
import { BookOpen, Users } from "lucide-react";

interface CourseCardProps {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  totalDuration?: number;
  teacherName?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  avgRating?: number;
  enrollmentCount?: number;
  progressPercent?: number;
  showProgress?: boolean;
}

export const CourseCard = memo(function CourseCard({
  slug,
  title,
  description,
  thumbnail,
  totalDuration = 0,
  teacherName,
  categoryName,
  avgRating,
  enrollmentCount,
  progressPercent,
  showProgress = false,
}: CourseCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        href={`/courses/${slug}`}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-linear-to-br from-primary/10 via-primary/5 to-transparent">
              <BookOpen className="h-8 w-8 text-primary/25" />
              <span className="text-lg font-bold text-primary/30">
                {title.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          {showProgress && progressPercent !== undefined && (
            <div className="absolute right-3 top-3">
              <ProgressRing percent={progressPercent} size={48} />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          {categoryName && (
            <CategoryBadge name={categoryName} className="mb-2" />
          )}
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {description}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between pt-3">
            <div className="flex items-center gap-2">
              {teacherName && (
                <span className="text-xs text-muted-foreground">
                  {teacherName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {enrollmentCount !== undefined && enrollmentCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {enrollmentCount}
                </span>
              )}
              {avgRating !== undefined && avgRating > 0 && (
                <RatingStars rating={avgRating} size="sm" />
              )}
              {totalDuration > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formatDuration(totalDuration)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
