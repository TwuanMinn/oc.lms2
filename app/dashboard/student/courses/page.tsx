"use client";

import { trpc } from "@/lib/trpc/client";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { AnimatedPage, StaggerGrid, StaggerItem, AnimatedShimmerButton } from "@/components/ui/animated";
import { springBounce } from "@/lib/motion";
import { formatDate } from "@/lib/utils";

interface EnrolledCourse {
  enrollmentId: string;
  courseId: string;
  courseSlug: string | null;
  courseTitle: string | null;
  enrolledAt: string | Date;
  completedAt: string | Date | null;
  progressPercent: number | null;
}

export default function StudentCoursesPage() {
  const {
    data: enrolledCourses,
    isLoading,
    isError,
    refetch,
  } = trpc.enrollment.myEnrollments.useQuery();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar role="STUDENT" />
        <main className="flex-1 p-6">
          <AnimatedPage>
            <PageHeader
              title="My Courses"
              description="Manage all your active and completed courses"
            />

            <div className="mt-8">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : isError ? (
                <ErrorState
                  title="Couldn't load your courses"
                  description="There was a problem fetching your enrollments. Please try again."
                  onRetry={() => refetch()}
                />
              ) : enrolledCourses && enrolledCourses.length > 0 ? (
                <StaggerGrid className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {(enrolledCourses as EnrolledCourse[]).map((e) => (
                    <StaggerItem key={e.enrollmentId} scale>
                      <Link href={`/courses/${e.courseSlug ?? e.courseId}`}>
                        <motion.div
                          whileHover={{
                            y: -4,
                            boxShadow: "0 8px 24px rgba(225, 29, 72, 0.06)",
                            borderColor: "rgba(225, 29, 72, 0.3)",
                          }}
                          transition={springBounce}
                          className="cursor-pointer rounded-xl border border-border/50 bg-card p-4 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {e.courseTitle ?? `Course ${e.courseId.slice(0, 8)}...`}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Enrolled {formatDate(e.enrolledAt)}</span>
                              </div>
                            </div>
                            {e.completedAt && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                className="ml-2 shrink-0 rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500"
                              >
                                Completed ✓
                              </motion.span>
                            )}
                          </div>
                          {!e.completedAt && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${e.progressPercent ?? 0}%` }}
                                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                                  className="h-full rounded-full bg-primary"
                                />
                              </div>
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {e.progressPercent ?? 0}%
                              </span>
                            </div>
                          )}
                        </motion.div>
                      </Link>
                    </StaggerItem>
                  ))}
                </StaggerGrid>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No courses yet"
                  description="Browse our catalog and enroll in a course to start learning."
                  action={
                    <AnimatedShimmerButton className="rounded-lg bg-primary shadow-lg shadow-primary/20">
                      <Link
                        href="/courses"
                        className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Browse courses
                      </Link>
                    </AnimatedShimmerButton>
                  }
                />
              )}
            </div>
          </AnimatedPage>
        </main>
      </div>
    </div>
  );
}
