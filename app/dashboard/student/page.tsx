"use client";

import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { BookOpen, PlayCircle, Clock, CheckCircle2, Award, Flame, ArrowRight, Sparkles } from "lucide-react";
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

function StreakWidget({ streak, activityDays }: { streak: number; activityDays: { date: string; count: number }[] }) {
  const last14 = [];
  const today = new Date();
  const activeDates = new Map(activityDays.map((d) => [d.date, d.count]));

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    last14.push({ date: dateStr, count: activeDates.get(dateStr) ?? 0, day: d.toLocaleDateString("en", { weekday: "narrow" }) });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{streak}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Day Streak</p>
          </div>
        </div>
        {streak > 0 && (
          <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-bold text-orange-500">
            🔥 On fire!
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {last14.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-6 w-full rounded-sm transition-colors ${
                d.count > 2
                  ? "bg-primary"
                  : d.count > 0
                    ? "bg-primary/40"
                    : "bg-muted/40"
              }`}
              title={`${d.date}: ${d.count} lesson${d.count !== 1 ? "s" : ""}`}
            />
            <span className="text-[8px] text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const { user, role } = useAuth();

  const {
    data: enrolledCourses,
    isLoading,
    isError,
    refetch,
  } = trpc.enrollment.myEnrollments.useQuery();

  const { data: streakData } = trpc.certificate.streakData.useQuery();
  const { data: certCount } = trpc.certificate.count.useQuery();
  const { data: recommended } = trpc.enrollment.recommended.useQuery();

  const activeCourses = ((enrolledCourses as EnrolledCourse[]) || []).filter((e) => !e.completedAt);
  const completedCourses = ((enrolledCourses as EnrolledCourse[]) || []).filter((e) => e.completedAt);
  const lastActive = activeCourses[0];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar role={role} />
        <main className="flex-1 p-6">
          <AnimatedPage>
            {/* ─── Gamified Command Center Hero ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-background to-primary/5 shadow-2xl"
            >
              {/* Animated glowing mesh gradients */}
              <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/20 blur-[100px] mix-blend-screen" />
              <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-rose-500/10 blur-[80px] mix-blend-screen" />
              
              <div className="relative p-6 sm:p-10 flex flex-col lg:flex-row gap-8 lg:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-xl shadow-inner"
                    >
                      👋
                    </motion.div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">
                      Command Center
                    </p>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground mb-3">
                    Ready to level up, {user?.name?.split(" ")[0] ?? "Student"}?
                  </h1>
                  <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
                    You&apos;re currently dominating <strong className="text-foreground">{activeCourses.length} active courses</strong>. 
                    {streakData && streakData.currentStreak > 0 ? ` Don't lose your ${streakData.currentStreak}-day learning streak!` : ` Start learning today to build your streak.`}
                  </p>
                </div>

                {/* Next Up Course Action Block */}
                <div className="w-full lg:w-[400px] shrink-0">
                  {lastActive ? (
                    <div className="rounded-xl border border-primary/30 bg-background/80 backdrop-blur-xl p-5 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Next Up</p>
                      <h3 className="font-bold text-lg leading-tight mb-2 truncate" title={lastActive.courseTitle ?? ""}>
                        {lastActive.courseTitle ?? `Course ${lastActive.courseId.slice(0, 8)}...`}
                      </h3>
                      
                      <div className="mt-4 mb-5 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${lastActive.progressPercent ?? 0}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full rounded-full bg-linear-to-r from-primary to-rose-500"
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          {lastActive.progressPercent ?? 0}%
                        </span>
                      </div>

                      <Link href={`/courses/${lastActive.courseSlug ?? lastActive.courseId}`}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
                        >
                          <PlayCircle className="h-5 w-5" />
                          Resume Learning
                        </motion.button>
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center h-full flex flex-col justify-center">
                      <Sparkles className="mx-auto h-8 w-8 text-primary/50 mb-3" />
                      <p className="text-sm font-medium text-foreground mb-4">No active courses right now.</p>
                      <Link href="/courses">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="mx-auto flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-bold text-background transition-all hover:bg-foreground/90"
                        >
                          <BookOpen className="h-4 w-4" />
                          Explore Catalog
                        </motion.button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ─── Metrics + Streak Row ─── */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
              {/* Stats */}
              <StaggerGrid className="col-span-1 lg:col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: "Active Courses", value: activeCourses.length.toString(), icon: BookOpen, color: "bg-sky-500/10 text-sky-500" },
                  { label: "Completed", value: completedCourses.length.toString(), icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-500" },
                  { label: "Certificates", value: (certCount ?? 0).toString(), icon: Award, color: "bg-amber-500/10 text-amber-500" },
                ].map((stat, i) => (
                  <StaggerItem key={i} scale>
                    <motion.div
                      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
                      className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all"
                    >
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                        <stat.icon className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                      </div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerGrid>

              {/* Streak Widget */}
              <StreakWidget
                streak={streakData?.currentStreak ?? 0}
                activityDays={streakData?.recentActivity ?? []}
              />
            </div>

            <div className="mt-8">
              <motion.h2
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-4 text-lg font-semibold"
              >
                My enrolled courses
                {enrolledCourses && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({enrolledCourses.length})
                  </span>
                )}
              </motion.h2>

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
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
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
                </motion.div>
              )}
            </div>

            {/* ─── Recommended Courses ─── */}
            {recommended && recommended.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Recommended for you
                  </h2>
                  <Link href="/courses" className="text-sm font-medium text-primary flex items-center gap-1 hover:text-primary/80">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recommended.slice(0, 3).map((course) => (
                    <StaggerItem key={course.id} scale>
                      <Link href={`/courses/${course.slug}`}>
                        <motion.div
                          whileHover={{ y: -4, borderColor: "rgba(225, 29, 72, 0.3)" }}
                          transition={springBounce}
                          className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:shadow-md"
                        >
                          <p className="text-sm font-bold group-hover:text-primary transition-colors truncate">
                            {course.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {course.description}
                          </p>
                          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{course.enrollmentCount} students</span>
                            <span className="font-semibold text-foreground">
                              Free
                            </span>
                          </div>
                        </motion.div>
                      </Link>
                    </StaggerItem>
                  ))}
                </StaggerGrid>
              </motion.div>
            )}
          </AnimatedPage>
        </main>
      </div>
    </div>
  );
}
